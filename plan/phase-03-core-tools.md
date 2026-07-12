# Phase 3 — Core tools

**Status:** ✅ Complete  
**Plan pass:** 4

## Goal

Implement the LLM-callable tools that expose Graphify’s core operations: build, query, path, explain, and affected.

## In scope

- `graphify_build` tool
- `graphify_query` tool
- `graphify_path` tool
- `graphify_explain` tool
- `graphify_affected` tool
- Tool parameter schemas using typebox
- Capability-based tool registration inside `session_start` after coordinator initialization
- Tool deduplication guard using a `Set<string>` of registered tool names
- Shared result formatting helpers
- Tool descriptions tuned for the LLM

## Out of scope

- Slash commands (Phase 4)
- File watcher automation (Phase 5)
- MCP backend (Phase 6)
- Hermes memory integration (Phase 7)
- Read interception (Phase 6)

## Key deliverables

- `src/tools/build.ts`
- `src/tools/query.ts`
- `src/tools/path.ts`
- `src/tools/explain.ts`
- `src/tools/affected.ts`
- Updated `src/tools/index.ts`
- Shared result formatting utilities
- Tool schema definitions

## Task breakdown

### 1. Shared tool infrastructure

- [x] Create `src/tools/types.ts` with `ToolContext` and result helper types
- [x] Create `src/tools/format.ts` with shared result formatting helpers
  - [x] `formatGraphifyResult(result)` returns tool content array
  - [x] `formatGraphifyError(error)` returns friendly error text

### 2. Tool schemas

- [x] `graphify_build`: `cwd`, `codeOnly?`, `update?`, `directed?`
- [x] `graphify_query`: `cwd`, `question`
- [x] `graphify_path`: `cwd`, `source`, `target`
- [x] `graphify_explain`: `cwd`, `node`
- [x] `graphify_affected`: `cwd`, `files[]`
- [x] `graphify_version`: no parameters (or optional `cwd`)

Use `typebox` `Type.Object` with descriptions on each field.

### 3. Implement `graphify_build`

- [x] File: `src/tools/build.ts`
- [x] Validate `cwd` is a string
- [x] Call `coordinator.build({ cwd, codeOnly, update, directed })`
- [x] Return formatted result or error
- [x] Register only when `coordinator.supports('build')` inside `session_start`

### 4. Implement `graphify_query`

- [x] File: `src/tools/query.ts`
- [x] Validate `question` is non-empty
- [x] Call `coordinator.query({ cwd, question })`
- [x] Return formatted result or error
- [x] Register only when `coordinator.supports('query')` inside `session_start`

### 5. Implement `graphify_path`

- [x] File: `src/tools/path.ts`
- [x] Validate `source` and `target` are non-empty
- [x] Call `coordinator.path({ cwd, source, target })`
- [x] Return formatted result or error
- [x] Register only when `coordinator.supports('path')` inside `session_start`

### 6. Implement `graphify_explain`

- [x] File: `src/tools/explain.ts`
- [x] Validate `node` is non-empty
- [x] Call `coordinator.explain({ cwd, node })`
- [x] Return formatted result or error
- [x] Register only when `coordinator.supports('explain')` inside `session_start`

### 7. Implement `graphify_affected`

- [x] File: `src/tools/affected.ts`
- [x] Validate `files` is a non-empty array of strings
- [x] Call `coordinator.affected({ cwd, files })`
- [x] Return formatted result or error
- [x] Register only when `coordinator.supports('affected')` inside `session_start`

### 8. Implement `graphify_version`

- [x] File: `src/tools/version.ts`
- [x] Call `coordinator.getVersion()`
- [x] Return formatted version text or error
- [x] Register only when `coordinator.supports('version')` inside `session_start`

### 9. Tool registration and capability gating

- [x] Update `src/tools/index.ts` to accept a `Set<string>` of registered tool names
- [x] Add `registerBuildTool`, `registerQueryTool`, `registerPathTool`, `registerExplainTool`, `registerAffectedTool`, `registerVersionTool`
- [x] Only call `pi.registerTool` when `coordinator.supports(feature)` is true
- [x] Skip already-registered tool names to prevent duplicate registration if `session_start` fires again
- [x] Move `registerGraphifyTools` call from extension load time to `session_start` after `coordinator.initialize()`

### 10. Error handling

- [x] Catch `GraphifyError` in tool executors
- [x] Return user-friendly error text in tool content
- [x] Do not throw from tool executors (return structured error content)

### 11. Testing

- [x] Create a mock `GraphifyBackend` for unit tests
- [x] Test each tool with the mock backend
- [x] Verify tools are registered only when the backend reports the matching capability
- [x] Verify tools handle `GraphifyError` gracefully
- [x] Verify duplicate registration is prevented when `session_start` fires again

### 12. Verification

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] All new tools are registered correctly based on backend capabilities
- [x] No runtime errors when Graphify is missing (no tools are registered)

- [x] Each tool can be invoked by the LLM when the capability is present
- [x] Tools route through `GraphifyCoordinator`
- [x] Tools are not registered when backend capabilities are missing
- [x] Tool outputs are formatted consistently
- [x] Tools respect timeouts and return friendly errors (via coordinator/backend)
- [x] Extension type-checks and lints cleanly

## Decisions

### 1. Capability gating at registration time

**Decision:** Tools are registered only inside `session_start`, after the coordinator has initialized and detected capabilities. Each tool is registered only when `coordinator.supports(feature)` is true. A `Set<string>` tracks registered tool names so repeated `session_start` events do not duplicate registrations.

**Why:** The LLM should not see tools it cannot use. Wasting a tool call on an unsupported feature costs tokens and slows the conversation. Pi's extension API supports `pi.registerTool()` inside `session_start`, and tools registered there are refreshed immediately for the current session without requiring `/reload`. A deduplication guard prevents errors if the session lifecycle fires `session_start` more than once.

**Alternatives considered:**
- Execution-time gating inside each tool. Rejected because the LLM still sees and may call unsupported tools, wasting tool calls and tokens.
- Late registration without a deduplication guard. Rejected because `session_start` can fire multiple times per extension instance, risking duplicate tool name errors.

### 2. Test runner

**Decision:** Use Node.js built-in `node:test` runner with `tsx` for TypeScript execution.

**Why:** It avoids a heavy test framework dependency and keeps tests close to the runtime Pi uses. `tsx` is added as a dev dependency to transpile TypeScript test files.

### 3. Mock backend injection

**Decision:** `GraphifyCoordinator` accepts an optional `backend` in its constructor for tests.

**Why:** Tools need a coordinator backed by a mock `GraphifyBackend`. Making the backend injectable keeps production code unchanged while enabling deterministic unit tests.

## Dependencies

- **Phase 2 — Backend abstraction** must be complete. Tools route through the coordinator and depend on the backend interface.

## Risks

- Tool parameter schemas may need several iterations once we see how the LLM uses them.
- Shared result formatting may not handle all Graphify output shapes.
- Capabilities may disable tools the user expects to work.

## Testing notes

- Each tool is tested with a mocked backend, not the real CLI.
- Verify tools are registered only when the backend reports the matching capability.
- Verify duplicate registration is prevented when `session_start` is triggered again.
- Verify tools handle `GraphifyError` gracefully and return structured error content.
- The coordinator accepts an injected backend so tests can avoid CLI discovery and process spawning.

## Notes

Tool design should mirror the `GraphifyBackend` operations defined in Phase 2. Schemas should be strict enough to guide the LLM but permissive enough for real-world queries.
