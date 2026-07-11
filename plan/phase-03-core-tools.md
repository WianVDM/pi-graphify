# Phase 3 — Core tools

**Status:** 🔄 Active  
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
- Capability-based tool registration (disable tools the backend cannot support)
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

- [ ] Create `src/tools/types.ts` with `ToolContext` and result helper types
- [ ] Create `src/tools/format.ts` with shared result formatting helpers
  - [ ] `formatGraphifyResult(result)` returns tool content array
  - [ ] `formatGraphifyError(error)` returns friendly error text

### 2. Tool schemas

- [ ] `graphify_build`: `cwd`, `codeOnly?`, `update?`, `directed?`
- [ ] `graphify_query`: `cwd`, `question`
- [ ] `graphify_path`: `cwd`, `source`, `target`
- [ ] `graphify_explain`: `cwd`, `node`
- [ ] `graphify_affected`: `cwd`, `files[]`
- [ ] `graphify_version`: no parameters (or optional `cwd`)

Use `typebox` `Type.Object` with descriptions on each field.

### 3. Implement `graphify_build`

- [ ] File: `src/tools/build.ts`
- [ ] Validate `cwd` is a string
- [ ] Call `coordinator.build({ cwd, codeOnly, update, directed })`
- [ ] Return formatted result or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('build')`

### 4. Implement `graphify_query`

- [ ] File: `src/tools/query.ts`
- [ ] Validate `question` is non-empty
- [ ] Call `coordinator.query({ cwd, question })`
- [ ] Return formatted result or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('query')`

### 5. Implement `graphify_path`

- [ ] File: `src/tools/path.ts`
- [ ] Validate `source` and `target` are non-empty
- [ ] Call `coordinator.path({ cwd, source, target })`
- [ ] Return formatted result or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('path')`

### 6. Implement `graphify_explain`

- [ ] File: `src/tools/explain.ts`
- [ ] Validate `node` is non-empty
- [ ] Call `coordinator.explain({ cwd, node })`
- [ ] Return formatted result or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('explain')`

### 7. Implement `graphify_affected`

- [ ] File: `src/tools/affected.ts`
- [ ] Validate `files` is a non-empty array of strings
- [ ] Call `coordinator.affected({ cwd, files })`
- [ ] Return formatted result or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('affected')`

### 8. Implement `graphify_version`

- [ ] File: `src/tools/version.ts`
- [ ] Call `coordinator.getVersion()`
- [ ] Return formatted version text or error
- [ ] Register in `src/tools/index.ts` only when `coordinator.supports('version')`

### 9. Tool registration and capability gating

- [ ] Update `src/tools/index.ts` to register all Phase 3 tools
- [ ] Add `registerBuildTool`, `registerQueryTool`, `registerPathTool`, `registerExplainTool`, `registerAffectedTool`, `registerVersionTool`
- [ ] Before registering each tool, check `coordinator.supports(feature)`
- [ ] If a capability is missing, skip registration so the LLM does not see the tool

### 10. Error handling

- [ ] Catch `GraphifyError` in tool executors
- [ ] Return user-friendly error text in tool content
- [ ] Do not throw from tool executors (return structured error content)

### 11. Testing

- [ ] Create a mock `GraphifyBackend` for unit tests
- [ ] Test each tool with the mock backend
- [ ] Verify tools are not registered when capability is false
- [ ] Verify tools handle `GraphifyError` gracefully

### 12. Verification

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All new tools are registered correctly based on backend capabilities
- [ ] No runtime errors when Graphify is missing (tools simply are not registered)

- [ ] Each tool can be invoked by the LLM
- [ ] Tools route through `GraphifyCoordinator`
- [ ] Tools are disabled when backend capabilities are missing
- [ ] Tool outputs are formatted consistently
- [ ] Tools respect timeouts and return friendly errors
- [ ] Extension type-checks and lints cleanly

## Dependencies

- **Phase 2 — Backend abstraction** must be complete. Tools route through the coordinator and depend on the backend interface.

## Risks

- Tool parameter schemas may need several iterations once we see how the LLM uses them.
- Shared result formatting may not handle all Graphify output shapes.
- Capabilities may disable tools the user expects to work.

## Testing notes

- Each tool should be tested with a mocked backend, not the real CLI.
- Verify tools are registered only when the backend reports the matching capability.
- Test error handling and timeout behavior.

## Notes

Tool design should mirror the `GraphifyBackend` operations defined in Phase 2. Schemas should be strict enough to guide the LLM but permissive enough for real-world queries.
