/** One Item in a Flow: its Lane and, when it starts or ends there, the Lane it Forks from or Joins. */
export interface FlowItem {
  lane: string
  fork?: string
  join?: string
}

/** A Lane column, numbered 1 through 4 so CSS can select it. */
export type FlowColumn = "1" | "2" | "3" | "4"

/** Where a Lane's own Line starts and ends at an Item. */
export type FlowCap = "start" | "end" | "both"

/** Attributes for the Flow Timeline. Empty when there are no Items. */
export interface FlowTimelineAttributes {
  "data-flow"?: FlowColumn
}

/** Attributes for one Item in a Flow. */
export interface FlowItemAttributes {
  "data-lane": string
  "data-flow-col": FlowColumn
  "data-flow-through"?: string
  "data-flow-fork"?: FlowColumn
  "data-flow-join"?: FlowColumn
  "data-flow-cap"?: FlowCap
}

/** The attributes a Flow needs: one object for the Timeline and one for each Item. */
export interface FlowLayout {
  timeline: FlowTimelineAttributes
  items: FlowItemAttributes[]
}

/** Thrown when the Items cannot form a Flow. */
export class FlowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FlowError"
  }
}

interface LaneStart {
  column: FlowColumn
  start: boolean
  forkColumn?: FlowColumn
}

interface FlowState {
  readonly running: Map<string, FlowColumn>
  readonly ended: Set<string>
  hasRoot: boolean
  maxColumn: number
}

const MAX_COLUMNS = 4

/**
 * Computes the Flow attributes for Items in time order without touching the DOM.
 * The first Lane is the root at column 1; the smallest free column is reused after a Join.
 * @throws {FlowError} when the Items cannot form a Flow
 */
export function flowAttributes(items: readonly FlowItem[]): FlowLayout {
  const state: FlowState = { running: new Map(), ended: new Set(), hasRoot: false, maxColumn: 0 }
  const lastReference = lastReferenceIndexByLane(items)
  const attributes = items.map((item, index) => {
    releaseLanesPastLastReference(state, index, lastReference)
    return itemFlowAttributes(item, index, state, lastReference)
  })
  return { timeline: timelineFlowAttributes(state), items: attributes }
}

function releaseLanesPastLastReference(state: FlowState, index: number, lastReference: Map<string, number>): void {
  for (const lane of [...state.running.keys()]) {
    if ((lastReference.get(lane) ?? -1) < index) state.running.delete(lane)
  }
}

function itemFlowAttributes(item: FlowItem, index: number, state: FlowState, lastReference: Map<string, number>): FlowItemAttributes {
  validateNames(item, index)
  const lane = startLane(item, index, state)
  const through = throughAttribute(state, item, index, lastReference)
  const joinColumn = joinColumnFor(item, index, state)
  const endsHere = item.join === undefined && lastReference.get(item.lane) === index
  const attributes: FlowItemAttributes = { "data-lane": item.lane, "data-flow-col": lane.column }

  if (through !== undefined) attributes["data-flow-through"] = through
  if (lane.forkColumn !== undefined) attributes["data-flow-fork"] = lane.forkColumn
  if (joinColumn !== undefined) attributes["data-flow-join"] = joinColumn
  const cap = capAttribute(lane.start, endsHere)
  if (cap !== undefined) attributes["data-flow-cap"] = cap

  if (item.join !== undefined) finishLane(state, item.lane)
  return attributes
}

function validateNames(item: FlowItem, index: number): void {
  if (item.lane === "") throw itemError(index, item, "lane must not be empty")
  if (item.fork === "") throw itemError(index, item, "fork must not be empty")
  if (item.join === "") throw itemError(index, item, "join must not be empty")
}

function startLane(item: FlowItem, index: number, state: FlowState): LaneStart {
  const runningColumn = state.running.get(item.lane)
  if (runningColumn !== undefined) return continueLane(item, index, runningColumn)
  assertNotEnded(item, index, state)
  if (item.fork === undefined) return startRootLane(item, index, state)
  return startForkLane(item, item.fork, index, state)
}

function continueLane(item: FlowItem, index: number, column: FlowColumn): LaneStart {
  if (item.fork !== undefined) throw itemError(index, item, "cannot Fork because the Lane is already running")
  return { column, start: false }
}

function assertNotEnded(item: FlowItem, index: number, state: FlowState): void {
  if (state.ended.has(item.lane)) throw itemError(index, item, "cannot add an Item to a Lane that has already Joined")
}

function startRootLane(item: FlowItem, index: number, state: FlowState): LaneStart {
  if (state.hasRoot) throw itemError(index, item, "a second root Lane is not allowed; Fork from a running Lane")
  state.hasRoot = true
  return addLane(state, item.lane, "1")
}

function startForkLane(item: FlowItem, source: string, index: number, state: FlowState): LaneStart {
  const forkColumn = state.running.get(source)
  if (forkColumn === undefined) throw itemError(index, item, `cannot Fork from Lane "${source}" because it is not running`)
  return addLane(state, item.lane, nextFreeColumn(state, index, item), forkColumn)
}

function addLane(state: FlowState, lane: string, column: FlowColumn, forkColumn?: FlowColumn): LaneStart {
  state.running.set(lane, column)
  state.maxColumn = Math.max(state.maxColumn, Number(column))
  return { column, start: true, forkColumn }
}

function nextFreeColumn(state: FlowState, index: number, item: FlowItem): FlowColumn {
  const used = new Set(state.running.values())
  for (let column = 1; column <= MAX_COLUMNS; column += 1) {
    const label = columnLabel(column)
    if (!used.has(label)) return label
  }
  throw itemError(index, item, "more than four Lanes would run at once")
}

function throughAttribute(state: FlowState, item: FlowItem, index: number, lastReference: Map<string, number>): string | undefined {
  const columns = [...state.running.entries()]
    .filter(([name]) => name !== item.lane && !endsAtTopOfRow(name, item, index, lastReference))
    .map(([, column]) => column)
    .sort(compareColumns)
  return columns.length === 0 ? undefined : columns.join(" ")
}

function endsAtTopOfRow(lane: string, item: FlowItem, index: number, lastReference: Map<string, number>): boolean {
  return lastReference.get(lane) === index && item.fork === lane && item.join !== lane
}

function compareColumns(a: FlowColumn, b: FlowColumn): number {
  return Number(a) - Number(b)
}

function joinColumnFor(item: FlowItem, index: number, state: FlowState): FlowColumn | undefined {
  if (item.join === undefined) return undefined
  if (item.join === item.lane) throw itemError(index, item, "cannot Join itself")
  const column = state.running.get(item.join)
  if (column === undefined) throw itemError(index, item, `cannot Join Lane "${item.join}" because it is not running`)
  return column
}

function finishLane(state: FlowState, lane: string): void {
  state.running.delete(lane)
  state.ended.add(lane)
}

function capAttribute(start: boolean, end: boolean): FlowCap | undefined {
  if (start && end) return "both"
  if (start) return "start"
  if (end) return "end"
  return undefined
}

function timelineFlowAttributes(state: FlowState): FlowTimelineAttributes {
  if (state.maxColumn === 0) return {}
  return { "data-flow": columnLabel(state.maxColumn) }
}

function lastReferenceIndexByLane(items: readonly FlowItem[]): Map<string, number> {
  const lastReference = new Map<string, number>()
  for (const [index, item] of items.entries()) {
    lastReference.set(item.lane, index)
    if (item.fork !== undefined) lastReference.set(item.fork, index)
    if (item.join !== undefined) lastReference.set(item.join, index)
  }
  return lastReference
}

function columnLabel(column: number): FlowColumn {
  if (column === 1) return "1"
  if (column === 2) return "2"
  if (column === 3) return "3"
  return "4"
}

function itemError(index: number, item: FlowItem, problem: string): FlowError {
  return new FlowError(`Item ${index + 1} (Lane "${item.lane}"): ${problem}`)
}
