# Phase 5 — Automation

**Status:** ⏳ Pending  
**Plan pass:** 3

## Goal

Reduce manual intervention by watching source files, detecting stale graphs, and surfacing automatic hints to the agent.

## In scope

- File watcher using `chokidar`
- Debounced incremental rebuilds (`coordinator.build({ update: true, codeOnly: true })`)
- Staleness detection for `graphify-out/graph.json`
- Git hook helper instructions
- Auto-injection of context hints when a graph is present or stale
- Configurable automation levels (`autoWatch`, `autoHint`, `autoRebuildCodeOnly`)

## Out of scope

- Full semantic rebuilds on every save (too expensive)
- MCP backend automation (Phase 6)
- Hermes memory integration (Phase 7)
- Public MCP server hosting

## Key deliverables

- `src/watcher.ts` — watcher manager
- `src/state.ts` or state helpers in `src/graphify.ts` for staleness detection
- Updated `extensions/index.ts` event handlers (`session_start`, `session_shutdown`, `before_agent_start`)
- Auto-hint logic in `before_agent_start`
- Documentation for optional git hook setup

## Task breakdown

- [ ] Implement `src/watcher.ts` with `chokidar`-based file watching
  - [ ] Accept root, debounce window, ignored patterns, and coordinator provider
  - [ ] Ignore `node_modules/`, `.git/`, `graphify-out/`, and other non-source directories
  - [ ] Debounce change events using `setTimeout` / `clearTimeout`
  - [ ] Call `coordinator.build({ cwd, update: true, codeOnly: true })` on debounced changes
  - [ ] Stop watching and clear timers on `close()`
- [ ] Add staleness detection utility
  - [ ] Compare `graphify-out/graph.json` mtime against source files
  - [ ] Expose `isGraphStale(cwd, thresholdHours)` helper
- [ ] Extend `GraphifyConfig` with automation options
  - [ ] `autoWatch: boolean` (already exists; keep default `false`)
  - [ ] `autoHint: boolean` (default `true`)
  - [ ] `autoRebuildCodeOnly: boolean` (default `false`)
- [ ] Integrate watcher into `extensions/index.ts`
  - [ ] Start watcher in `session_start` when `config.autoWatch` is true and graph exists
  - [ ] Stop watcher in `session_shutdown`
  - [ ] Skip auto-watch if project is untrusted or Graphify is missing
- [ ] Enhance `before_agent_start` auto-hints
  - [ ] Inject graph hint when a graph is present
  - [ ] Append stale-graph warning when the graph is older than the threshold
- [ ] Add documentation for optional git hook setup
- [ ] Test watcher with mocked filesystem events
- [ ] Verify `npm run typecheck` and `npm run lint` pass

## Completion criteria

- [ ] Watcher can start and stop cleanly
- [ ] Changes trigger incremental code-only rebuilds
- [ ] Stale graphs are detected and reported
- [ ] Auto-hints are injected only when useful and not noisy
- [ ] Automation is opt-in or conservatively opt-out via config
- [ ] Extension type-checks and lints cleanly

## Decisions

### 1. Auto-rebuild is opt-in and code-only

**Decision:** The file watcher only runs when `config.autoWatch` is `true`, and it always uses `codeOnly: true` and `update: true`.

**Why:** Full semantic rebuilds are expensive and may consume LLM quota. Code-only updates are safe and fast. Keeping the watcher off by default avoids surprising resource usage.

**Alternatives considered:**
- Auto-watch on by default. Rejected because it could surprise users on large projects.
- Full semantic rebuilds on save. Rejected due to cost and latency.

## Dependencies

- **Phase 2 — Backend abstraction** for `CliBackend` and incremental rebuild support.
- **Phase 3 — Core tools** provides the `graphify_build` tool the watcher can mirror.
- **Phase 4 — Commands** must be complete so the watcher can be wired into the same extension entry point without conflicting with command registration.

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
