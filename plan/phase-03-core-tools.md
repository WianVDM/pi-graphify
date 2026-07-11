# Phase 3 — Core tools

**Status:** ⏳ Pending  
**Plan pass:** 3

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

## Task breakdown (rough)

- [ ] Define shared tool parameter types (cwd, question, path, source, target, etc.)
- [ ] Define tool schemas using typebox for build, query, path, explain, affected
- [ ] Implement `graphify_build` tool that calls `coordinator.build()`
- [ ] Implement `graphify_query` tool that calls `coordinator.query()`
- [ ] Implement `graphify_path` tool that calls `coordinator.path()`
- [ ] Implement `graphify_explain` tool that calls `coordinator.explain()`
- [ ] Implement `graphify_affected` tool that calls `coordinator.affected()`
- [ ] Add capability checks in `src/tools/index.ts` so tools are only registered when supported
- [ ] Add shared result formatting for Graphify CLI output
- [ ] Write tool descriptions optimized for the LLM
- [ ] Test each tool with a mocked backend
- [ ] Verify extension type-checks and lints cleanly

## Completion criteria

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
