# Phase 5 — Automation

**Status:** ⏳ Pending  
**Plan pass:** 2

## Goal

Reduce manual intervention by watching source files, detecting stale graphs, and surfacing automatic hints to the agent.

## In scope

- File watcher using `chokidar`
- Debounced incremental rebuilds (`graphify --update` with `codeOnly: true`)
- Staleness detection for `graphify-out/graph.json`
- Git hook helper instructions
- Auto-injection of context hints when a graph is present or stale
- Configurable automation levels (`autoWatch`, `autoHint`, etc.)

## Out of scope

- Full semantic rebuilds on every save (too expensive)
- MCP backend automation (Phase 6)
- Hermes memory integration (Phase 7)
- Public MCP server hosting

## Key deliverables

- `src/watcher.ts` — watcher manager
- Staleness utilities in `src/graphify.ts` or `src/state.ts`
- Updated `extensions/index.ts` event handlers
- Auto-hint logic in `before_agent_start`
- Documentation for optional git hook setup

## Completion criteria

- [ ] Watcher can start and stop cleanly
- [ ] Changes trigger incremental code-only rebuilds
- [ ] Stale graphs are detected and reported
- [ ] Auto-hints are injected only when useful and not noisy
- [ ] Automation is opt-in or conservatively opt-out via config
- [ ] Extension type-checks and lints cleanly

## Dependencies

- **Phase 2 — Backend abstraction** for `CliBackend` and incremental rebuild support.
- **Phase 3 — Core tools** is helpful but not strictly required; the watcher can call the coordinator directly.

## Risks

- File watcher can be noisy or resource-heavy on large projects.
- Auto-rebuilds may run at unexpected times if debouncing is wrong.
- Auto-hints may become spammy and degrade the agent experience.

## Testing notes

- Test watcher start/stop and event debouncing with mocked filesystem events.
- Test staleness detection logic without rebuilding real graphs.
- Verify auto-hints are injected only when enabled and useful.

## Notes

Automation must be safe and conservative. The extension should never run expensive operations without user awareness. `codeOnly: true` is the default for auto-rebuilds.
