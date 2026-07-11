# Release Standards

This document defines how `pi-graphify` is versioned and released.

---

## Versioning

`pi-graphify` follows [Semantic Versioning 2.0.0](https://semver.org/):

| Position | Name | Bumped when |
|---|---|---|
| `MAJOR` | Breaking release | A public tool, command, config option, or behavior changes in a way that could break existing users. |
| `MINOR` | Feature release | New tools, commands, or backward-compatible features are added. |
| `PATCH` | Fix release | Bugs are fixed, docs are corrected, or internal behavior improves without affecting the public API. |

Pre-1.0 policy: while the package is at `0.x`, the API is considered unstable. Minor releases may introduce substantial changes. Patch releases are safe to apply.

---

## What triggers each version bump

### MAJOR (`x.0.0`)

- Removing a registered tool or command.
- Renaming a tool, command, or parameter.
- Changing the default behavior of a tool or command in a way that breaks existing workflows.
- Changing the required config schema or environment variables.

### MINOR (`0.x.0`)

- Adding a new tool (e.g., `graphify_query`).
- Adding a new slash command (e.g., `/graphify-watch`).
- Adding new optional parameters to existing tools/commands.
- Adding new config options with safe defaults.
- Adding support for new Graphify CLI features.

### PATCH (`0.0.x`)

- Fixing a bug in a tool or command.
- Improving error messages or output formatting.
- Updating documentation.
- Updating dependencies that do not change public behavior.
- Internal refactoring with no user-visible change.

---

## Commit conventions

All commits must use [Conventional Commits](https://www.conventionalcommits.org/).

Allowed prefixes:

| Prefix | Use for |
|---|---|
| `feat:` | New user-facing feature or tool |
| `fix:` | Bug fix |
| `docs:` | Documentation-only changes |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `test:` | Adding or correcting tests |
| `chore:` | Maintenance, dependency updates, cleanup |
| `ci:` | Changes to CI/CD configuration |

For breaking changes, add `BREAKING CHANGE:` in the commit body or use `!` after the prefix:

```
feat!: remove graphify_status tool in favor of graphify_info
```

---

## Release workflow

Releases are automated with [release-please](https://github.com/googleapis/release-please) via `.github/workflows/release.yml`.

### How it works

1. **You commit to `main`** using conventional commits.
2. **release-please scans the commit history** and opens a Release PR titled something like `chore(main): release 0.2.0`.
3. **The Release PR contains:**
   - An updated `CHANGELOG.md`.
   - A version bump in `package.json` and `package-lock.json`.
4. **You review and merge the Release PR.**
5. **release-please creates:**
   - A Git tag (e.g., `v0.2.0`).
   - A GitHub Release with auto-generated notes.
6. **The `publish` job runs** and publishes the package to npm with provenance.

### Manual steps required

- Ensure `NPM_TOKEN` is configured as a repository secret in GitHub.
- Ensure GitHub Actions has permission to create pull requests.
- Review the Release PR before merging.

### No manual version bumps

Do not manually edit `version` in `package.json`. release-please handles this. The only exception is the very first `0.1.0`, which is already set.

---

## Branching strategy

Because this is a solo project, keep the branching model minimal:

- **`main`** is the only long-lived branch.
- Commit directly to `main` for small changes.
- Optional: use short-lived feature branches (e.g., `feat/query-tool`) if you want cleaner history, but they are not required.
- No release branches, no sub-branches, no cherry-pick branches.
- Hotfixes are committed to `main` and release-please cuts a new patch release.

---

## Git tags

Git tags are created automatically by release-please in the format `v0.2.0`. Do not create tags manually.

---

## npm provenance

The publish workflow uses `npm publish --provenance`, which attaches a signed attestation to the package on npm. This requires:

- The `publish` job runs in GitHub Actions.
- The workflow has `id-token: write` permission.
- The package is published with `--access public`.

---

## Pre-release checklist

Before merging a Release PR, verify:

- [ ] `CHANGELOG.md` accurately describes the release.
- [ ] The version bump is correct (patch/minor/major).
- [ ] `npm run typecheck` passes on `main`.
- [ ] `npm run lint` passes on `main`.
- [ ] `NPM_TOKEN` is available.

---

## Emergency fixes

If a release is broken and needs an immediate fix:

1. Commit the fix to `main` with `fix: <description>`.
2. release-please will open a new Release PR with a patch bump.
3. Merge it to publish the fix.

Do not unpublish npm versions. Prefer publishing a patch release over unpublishing.
