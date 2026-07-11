# Phase 2 — Backend abstraction

**Status:** 🔄 Active  
**Plan pass:** 4

## Goal

Introduce a stable backend interface and coordinator so all Graphify operations are routed through a single, backend-agnostic layer.

## In scope

- Define `GraphifyBackend` interface
- Implement `CliBackend` (CLI discovery, execution, output normalization, capability probing)
- Implement `GraphifyCoordinator` (config loading, backend selection, version detection, routing)
- Build initial capability matrix based on version + runtime probing
- Normalize errors into typed `GraphifyError`
- Refactor `graphify_status` tool and `/graphify-status` command to use the coordinator
- Keep existing extension entry point behavior intact

## Out of scope

- MCP backend (Phase 6)
- File watcher (Phase 5)
- New tools beyond status (Phase 3)
- New commands beyond `/graphify-status` (Phase 4)
- Advanced version mismatch UX (Phase 7)

## Key deliverables

- `src/backends/types.ts` — `GraphifyBackend` interface
- `src/backends/cli.ts` — `CliBackend` implementation
- `src/coordinator.ts` — `GraphifyCoordinator`
- `src/version.ts` — version detection + capability matrix
- `src/errors.ts` — `GraphifyError` and error normalization
- Refactored `src/graphify.ts`, `src/tools/status.ts`, `extensions/index.ts`

## Task breakdown

### 1. Define shared types

- [ ] Define `GraphifyCapabilities` interface (query, path, explain, affected, add, watch, reflect, mcp, etc.)
- [ ] Define `GraphifyResult` normalized output shape (stdout, stderr, exitCode, durationMs, backend, feature)
- [ ] Define `GraphifyBackend` interface with `type`, `version`, `capabilities`, `run`, and optional `close`
- [ ] Define `GraphifyConfig` shape for backend selection and paths
- [ ] Define `GraphifyError` codes and constructor shape

### 2. Implement `CliBackend`

- [ ] Resolve executable in order: `GRAPHIFY_PATH` env, `graphifyPath` config, `which/where graphify`, common install paths
- [ ] Implement `run(operation, options)` using `execFile` with configured timeout
- [ ] Normalize stdout/stderr into `GraphifyResult`
- [ ] Implement `version` detection via `graphify --version` (fallback to `graphify version`)
- [ ] Implement capability probing by running `graphify <cmd> --help` for each feature
- [ ] Cache `version` and `capabilities` after first detection
- [ ] Implement `close()` as a no-op for CLI
- [ ] Never construct shell strings; validate all paths

### 3. Implement version and capability detection

- [ ] Define `MIN_SUPPORTED_GRAPHIFY` constant (e.g., `2.100.0` — exact value to be validated against real CLI)
- [ ] Parse semver-style version strings defensively
- [ ] Handle unknown version by entering best-effort mode
- [ ] Implement capability matrix: min-version gate + runtime probe
- [ ] Map `graphify <cmd> --help` output to capability booleans

### 4. Implement `GraphifyCoordinator`

- [ ] Load config via `loadConfig()`
- [ ] Select backend: CLI only for now (MCP placeholder for Phase 6)
- [ ] Initialize backend once per session and detect version/capabilities
- [ ] Implement `supports(feature)` method
- [ ] Implement typed coordinator methods: `status(cwd)`, `build(opts)`, `query(opts)`, `path(opts)`, `explain(opts)`, `affected(opts)`, `version()`
- [ ] Map backend results/errors to `GraphifyError`
- [ ] Implement `close()` lifecycle that delegates to backend
- [ ] Handle missing Graphify by disabling all features and logging a typed error

### 5. Implement `GraphifyError`

- [ ] Define error codes: `MISSING`, `VERSION`, `BUILD`, `QUERY`, `TIMEOUT`, `MCP`, `UNKNOWN`
- [ ] Include `userMessage`, `code`, and `details` fields
- [ ] Map CLI exit codes and stderr to the right error code
- [ ] Provide actionable user messages (e.g., install command, update command)

### 6. Refactor existing code

- [ ] Move CLI execution logic from `src/graphify.ts` into `CliBackend`
- [ ] Keep `graphifyStatus(cwd)` and `buildGraphifyHint(graphPath)` in `src/graphify.ts` but route status through coordinator
- [ ] Update `src/tools/status.ts` to receive and use the coordinator
- [ ] Update `extensions/index.ts` to:
  - Instantiate `GraphifyCoordinator` on `session_start`
  - Pass coordinator to `registerGraphifyTools`
  - Call `coordinator.close()` on `session_shutdown`
- [ ] Ensure `/graphify-status` command uses the coordinator

### 7. Verification

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Extension loads without errors when Graphify is present
- [ ] Extension degrades gracefully when Graphify is missing
- [ ] `graphify_status` tool still returns correct graph existence
- [ ] `/graphify-status` command still works

## Completion criteria

- [ ] `GraphifyBackend` interface is stable and typed
- [ ] `CliBackend` can execute any Graphify subcommand and return normalized results
- [ ] `GraphifyCoordinator` selects backend, detects version, and builds capabilities
- [ ] `graphify_status` tool and `/graphify-status` command use the coordinator
- [ ] Extension still type-checks and lints cleanly
- [ ] Missing Graphify is handled gracefully without crashing the session

## Decisions

### 1. Capability matrix

**Hybrid approach: hardcoded minimum version + runtime probing.**

- A hardcoded `minSupported` version guards against known-incompatible installs.
- Features are probed at runtime with `graphify <cmd> --help`.
- Probed capabilities are cached for the session.

### 2. Missing Graphify

**Graceful degradation for the user; typed errors internally.**

- The extension stays alive and disables tools based on capabilities.
- Internally a `GraphifyError` with code `MISSING` is logged for diagnostics.
- The UI shows a friendly install/update hint.

### 3. `GraphifyBackend` interface

**Backend exposes `run(operation, options)`; coordinator exposes typed methods.**

- Keeps backend implementations thin and stable.
- Tools and commands get type safety through the coordinator.
- Allows the abstraction layer to land before all operation shapes are finalized.

### 4. Backend caching

**Per-session coordinator/backend with explicit `close()` lifecycle.**

- Version and capabilities are detected once per session.
- `session_shutdown` calls `coordinator.close()` → `backend.close()`.
- This design also supports the MCP backend in Phase 6.

## Dependencies

- **Phase 1 — Foundation** must be complete so the project structure, config, and tooling are in place.

## Risks

- Graphify CLI version/capability detection may differ across install methods, making the capability matrix fragile.
- The `GraphifyBackend` interface may need revision when MCP backend is added in Phase 6.
- Error normalization may be incomplete until we see more real CLI failure modes.

## Testing notes

- Unit-test `CliBackend` with a mock executable to verify argument passing and output normalization.
- Test `GraphifyCoordinator` backend selection logic and capability fallback.
- Test `GraphifyError` mapping for missing CLI, timeouts, and non-zero exit codes.

## Notes

This phase is purely about the abstraction layer. No new user-facing functionality is added beyond cleaner internals and more reliable error handling.
