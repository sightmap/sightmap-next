# Changesets

This directory drives `@sightmap/next`'s versioning and changelog via
[changesets](https://github.com/changesets/changesets), the same way the
`sightmap` and `sightkick` repos do.

- Add a changeset for any user-facing change to `packages/next`: `npm run changeset`
  (pick `patch` / `minor` / `major`, write a one-paragraph summary) and commit the
  generated `.changeset/*.md`. Changes to the examples, docs, or CI skip it; the
  examples are private workspaces and are never versioned.
- On pushes to `main`, the `release` workflow opens or updates a "Version Packages"
  PR that bumps `packages/next/package.json` and writes `packages/next/CHANGELOG.md`.
- Merging that PR publishes `@sightmap/next` to npm (OIDC trusted publishing, no
  token), tags `@sightmap/next@X.Y.Z`, and creates the GitHub release.

See `.github/workflows/release.yml` for the full flow.

`changeset status` and `changeset version` print `Package "with-sightmap-…" must depend on
the current version of "@sightmap/next"` for each example. That is a warning, not an error:
the examples depend on the package by `file:` path so that edits in `packages/next/src` are
live without a publish, and `version` leaves those ranges alone.
