# Release

This is the maintainer's guide for releasing tokiline. Changes are recorded with [Changesets](https://github.com/changesets/changesets). When changesets reach `main`, `.github/workflows/release.yml` opens a "version packages" pull request. Merging that pull request publishes the package to npm with provenance. `.github/workflows/pages.yml` publishes the demo site on every push to `main`.

To record a change, run `pnpm changeset` and commit the generated file in `.changeset/`.

## Trusted publishing

`release.yml` has no npm token. It relies on npm's trusted publishing (OpenID Connect between GitHub Actions and npm), which needs `id-token: write` in the workflow (already set). A person has to do the following once, after the package exists on npm (see [First release](#first-release)):

1. Sign in to npmjs.com as an owner of `tokiline` and open the package's **Settings**.
2. In the **Trusted Publisher** section, choose **GitHub Actions** and fill in:
   - Organization or user: `reeschan`
   - Repository: `tokiline`
   - Workflow filename: `release.yml` (the file name only, with the extension)
   - Environment name: leave empty (the workflow does not use a GitHub environment)
   - Allowed actions: allow direct `npm publish` (npm always allows `npm stage publish`; check the options shown on the page)
3. Save. npm does not validate the values when you save, and every field is case-sensitive, so a typo only shows up as a failed publish. A new configuration expires if it does not complete a successful publish within 2 days.
4. In the GitHub repository, open **Settings > Actions > General > Workflow permissions** and turn on **Allow GitHub Actions to create and approve pull requests**. `changesets/action` needs this to open the version packages pull request.
5. Do not set `NPM_TOKEN` or `NODE_AUTH_TOKEN` for the release job. A token makes the tool skip the OIDC exchange.

Requirements stated by npm: GitHub-hosted runners only (self-hosted runners are not supported), npm CLI 11.5.1 or later, Node 22.14.0 or later, and a `repository.url` in `package.json` that exactly matches the GitHub repository (it does: `git+https://github.com/reeschan/tokiline.git`). `package.json` also sets `publishConfig.provenance: true`, so provenance is requested explicitly.

Sources checked on 2026-10-13:

- https://docs.npmjs.com/trusted-publishers (settings fields, versions, limits)
- https://docs.npmjs.com/generating-provenance-statements (`id-token: write`, `publishConfig.provenance`)
- https://pnpm.io/cli/publish (pnpm's own statement about provenance and trusted publishing)

Not confirmed: the npm pages do not mention pnpm, and the pnpm page does not describe the OIDC exchange itself. So whether `pnpm publish` (see the next section) completes the exchange with the registry could not be verified without publishing. If the first automated publish fails on authentication, the fallback is to publish the tarball with npm: replace the `release` script with `pnpm build && pnpm pack --out tokiline.tgz && npm publish tokiline.tgz --access public` and keep the rest, or run the publish step with a recent npm. Do not add a long-lived token as a shortcut without deciding that on purpose.

## How changeset publish publishes

The installed `@changesets/cli` is 3.0.3. These files were read (not run):

- `node_modules/@changesets/cli/dist/getPublishPlan.mjs`: `getPublishTool` picks the tool from the package manager. When the workspace tool is not `npm`, `pnpm` or `yarn` (this repository is a single package with no `pnpm-workspace.yaml`, so the tool is `root`), it falls back to `package-manager-detector`, which reads the `packageManager` field (`pnpm@12.3.4`) and the lockfile, and gets `pnpm`. The `pnpm` branch's `publish` runs `pnpm publish [<tarball>] --json --access <access> --tag <tag> --no-git-checks`. Only the npm branch runs `npm publish`.
- `node_modules/@changesets/cli/dist/publish.mjs`: runs the publish plan through that tool, then creates git tags (`v0.1.0`; `node_modules/@changesets/cli/dist/gitTags.mjs` uses `v<version>` when the tool is `root`) for what was published.
- The same file also shows what is published: a package is published when its version is not found by `pnpm info`, and `private: true` packages are skipped (so `"private": true` had to be removed from `package.json`). `access` comes from `publishConfig.access`, otherwise `.changeset/config.json`.

Cautions for trusted publishing:

- The publish command is `pnpm publish`, not `npm publish`. pnpm 11 and later implement `publish` natively and no longer call the npm CLI (https://pnpm.io/cli/publish), so the Node and npm versions on the runner do not decide whether OIDC works. pnpm itself does. This is the point that could not be confirmed (see above).
- `changeset publish` removes the one-time-password environment variables from the child process. It does not touch `NODE_AUTH_TOKEN`, so keep that unset.
- `pnpm release` builds `dist` first (`pnpm build && changeset publish`). `files` is `["dist"]`, so a publish without a build would be empty.
- `--no-git-checks` means pnpm does not check that the branch is clean. The workflow runs on a fresh checkout of `main`.

## First release

Steps for the first version, 0.1.0. The pending changeset is `.changeset/initial-release.md` (`minor`, 0.0.0 to 0.1.0).

1. Create the GitHub repository `reeschan/tokiline` (public; provenance needs a public repository). Add it as `origin` and push `main`.
2. Import the ruleset: **Settings > Rules > Rulesets > New ruleset > Import a ruleset**, and choose `.github/rulesets/main.json`. It requires a pull request and the `ci-ok` check on `main`, so import it after the first push of `main`, or push once before importing.
3. Turn on GitHub Pages (see [GitHub Pages](#github-pages)) and the workflow permission from step 4 of [Trusted publishing](#trusted-publishing).
4. The push of `main` runs `release.yml`. It finds `.changeset/initial-release.md` and opens a pull request named "Version Packages" that sets `version` to `0.1.0` and writes `CHANGELOG.md`. Note: pull requests opened with the default `GITHUB_TOKEN` do not start other workflows, so `ci-ok` may not run on it. Close and reopen the pull request, or push an empty commit to its branch with your own account, so the checks run.
5. Trusted publishing cannot be set up for a package that does not exist yet (the npm settings page is under an existing package; npm's page does not state this outright, so check). If the **Trusted Publisher** section is not available, publish 0.1.0 by hand once, then set up trusted publishing and use the automated flow from the next release:
   1. Sign in: `npm login` (use an account with 2FA).
   2. On the Version Packages branch (or after merging it and pulling `main`) with `package.json` at `0.1.0`: `pnpm install --frozen-lockfile && pnpm check`.
   3. `pnpm build && npm publish --access public`. Provenance is only created in a supported CI, so a local publish has no provenance; pass `--provenance=false` if npm asks for it. Enter the 2FA code when asked.
   4. Do the steps in [Trusted publishing](#trusted-publishing).
   5. If you published by hand before merging the Version Packages pull request, merging it makes `release.yml` find 0.1.0 already in the registry and skip the publish. Create the tag with `git tag v0.1.0 && git push origin v0.1.0`.
6. If you did not publish by hand: merge the Version Packages pull request. `release.yml` runs again, `changesets/action` runs `pnpm release`, and 0.1.0 goes to npm with provenance.
7. Check `npm view tokiline version` and the provenance badge on the package page.

Checking an example by hand: pnpm does not update an already installed example when the tarball at the same path is rebuilt. After changing `src`, run `pnpm --dir examples/<name> update tokiline` before the install step (the same note is in `AGENTS.md`).

## GitHub Pages

`pages.yml` builds the library and the demo site (`pnpm build`, then `pnpm site:build` with `SITE_BASE=/tokiline/`) and deploys `site/dist` with the official Pages actions.

1. In the repository, open **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Push to `main`, or run the **Pages** workflow by hand (it has `workflow_dispatch`). The `github-pages` environment is created on the first run.
4. The site is published at https://reeschan.github.io/tokiline/.

If the deploy is rejected because of the environment's branch rules, make sure `main` is allowed under **Settings > Environments > github-pages > Deployment branches and tags**.
