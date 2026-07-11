# Phase 1 — Foundation

**Status:** ✅ Complete  
**Plan pass:** 2

## Goal

Establish the project structure, configuration, and initial tooling so the package loads cleanly in Pi and can detect a Graphify graph.

## In scope

- Project metadata and package structure
- TypeScript configuration
- Biome lint/format configuration
- GitHub Actions CI and release workflows
- Configuration loader with defaults and overrides
- Basic Graphify CLI discovery
- Initial `graphify_status` tool
- Extension entry point wiring (`session_start`, `before_agent_start`, `/graphify-status`)

## Out of scope

- Backend abstraction layer
- Real graph operations beyond status detection
- Slash commands beyond `/graphify-status`
- File watcher or automation
- MCP backend

## Key deliverables

- `package.json` with correct metadata, dependencies, and Pi config
- `tsconfig.json` including `src/**/*.ts`
- `biome.json`
- `.github/workflows/ci.yml` and `release.yml`
- `src/config.ts`
- `src/graphify.ts` (CLI discovery, status, hint formatting)
- `src/tools/status.ts` and `src/tools/index.ts`
- `extensions/index.ts`
- Updated `AGENTS.md`, `README.md`, `CHANGELOG.md`

## Completion criteria

- [x] `npm install` succeeds
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] Extension loads without errors in Pi
- [x] `graphify_status` tool returns whether `graphify-out/graph.json` exists

## Dependencies

- None. This phase bootstraps the project.

## Risks

- N/A — completed.

## Testing notes

- N/A — verified via `npm run typecheck` and `npm run lint`.

## Notes

Phase 1 was bootstrapped from the official Pi package template. Some template artifacts (`.agents/`, sample prompts, skills, themes) were removed or simplified.
