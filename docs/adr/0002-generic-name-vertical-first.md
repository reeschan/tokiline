# A generic name and orientation-neutral language, but 0.1 ships vertical only

The project started as a rewrite of a vertical timeline, but horizontal timelines are a natural next step, so nothing public encodes "vertical": the package is named `tokiline` (Japanese _toki_, "time", plus "line"), the CSS prefix is `toki-`, and placement is described with logical Sides (`start` / `end`) whose physical direction follows the Orientation and the writing direction. To keep 0.1 small, only the vertical Orientation ships; horizontal must be addable without renaming anything.

We chose `tokiline` because the obvious names were taken or too close to taken ones: `vertical-timeline` exists, and `timeline-kit` cannot be published because npm rejects new names that match an existing one (`timelinekit`) once punctuation is removed. We also wanted a name with no existing project of the same name on npm, GitHub, or the web, and `tokiline` had none on 2026-10-12.
