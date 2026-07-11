# Phase 8 — 1.0 readiness

**Status:** ⏳ Pending  
**Plan pass:** 2

## Goal

Polish the package for a stable release: tests, documentation, security review, and npm publication.

## In scope

- Unit and integration tests for coordinator, backends, and tools
- README with installation, usage, and configuration
- Security review (path validation, no shell injection, output sanitization)
- Stable configuration schema with validation
- Final CI/CD checks (typecheck, lint, audit, fallow)
- npm publish via release-please
- Listing readiness on pi.dev/packages

## Out of scope

- New features not already planned
- Major rewrites
- Bundling Graphify or Python

## Key deliverables

- Test suite (e.g., `src/**/*.test.ts` or `tests/`)
- Comprehensive `README.md`
- Finalized `AGENTS.md`
- Security review document or checklist
- Stable config schema
- Passing CI on every push/PR
- Published `1.0.0` release on GitHub and npm

## Completion criteria

- [ ] Tests cover core coordinator and backend logic
- [ ] README is accurate and complete for end users
- [ ] No known security issues
- [ ] Config schema is stable and validated
- [ ] CI passes (typecheck, lint, audit, fallow)
- [ ] Version `1.0.0` is released on GitHub and npm
- [ ] Package is ready for pi.dev/packages listing

## Dependencies

- All previous phases (1–7) must be complete.
- Configuration schema and public API surface must be stable.

## Risks

- Scope creep from new feature ideas just before release.
- Security review may surface issues requiring design changes.
- Test coverage gaps may delay release.
- Release timing may depend on upstream Graphify CLI stability.

## Testing notes

- Unit tests for coordinator, backends, and tools.
- Integration tests against a real Graphify CLI in a controlled project.
- CI must pass typecheck, lint, audit, and fallow.
- Dry-run `npm publish` to verify package contents.

## Notes

This phase is about quality and packaging, not new features. Any new feature ideas discovered during development should be deferred to post-1.0.
