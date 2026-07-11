# Phase 6 — Advanced features

**Status:** ⏳ Pending  
**Plan pass:** 3

## Goal

Add the MCP backend and advanced Graphify operations that require deeper integration or newer CLI features.

## In scope

- `McpBackend` implementation (spawn `graphify --mcp`, JSON-RPC client)
- Backend auto-selection (MCP preferred, CLI fallback)
- `graphify_add` tool and command
- `graphify_watch` tool and command
- `graphify_reflect` tool and command
- Optional read interception for graph-first queries
- Per-session MCP lifecycle management

## Out of scope

- Major rewrites or API redesigns
- Bundling Python or Graphify dependencies
- Auto-running semantic extraction on every save
- Hosting a persistent public MCP server
- API stability guarantees for new tools (stabilized in Phase 8)

## Key deliverables

- `src/backends/mcp.ts` — `McpBackend`
- `src/tools/add.ts`
- `src/tools/watch.ts`
- `src/tools/reflect.ts`
- Corresponding commands in `src/commands/`
- Read-interception logic in `extensions/index.ts` (if implemented)
- Updated backend selection logic in coordinator

## Task breakdown

- [ ] Implement `McpBackend` in `src/backends/mcp.ts` (spawn `graphify --mcp`, JSON-RPC client)
- [ ] Implement MCP tool listing and invocation
- [ ] Update `GraphifyCoordinator` to auto-select MCP when available and fall back to CLI
- [ ] Add config option for backend preference (`auto`, `cli`, `mcp`)
- [ ] Implement `graphify_add` tool and `/graphify-add` command
- [ ] Implement `graphify_watch` tool and `/graphify-watch` command
- [ ] Implement `graphify_reflect` tool and `/graphify-reflect` command
- [ ] Close MCP process cleanly on `session_shutdown`
- [ ] Implement optional read interception for graph-first queries (gated by config)
- [ ] Test MCP lifecycle (start, tool call, error, shutdown)
- [ ] Test coordinator fallback from MCP to CLI
- [ ] Verify `npm run typecheck` and `npm run lint` pass

## Completion criteria

- [ ] MCP backend can connect and call Graphify tools
- [ ] Coordinator auto-selects MCP when available, falls back to CLI
- [ ] `add`, `watch`, and `reflect` tools work through the backend interface
- [ ] MCP process is closed cleanly on session shutdown
- [ ] Read interception is optional and safe
- [ ] Extension type-checks and lints cleanly

## Dependencies

- **Phase 2 — Backend abstraction** must be complete; the `GraphifyBackend` interface is the integration point for MCP.
- **Phase 5 — Automation** is optional but relevant for `watch` tooling.

## Risks

- MCP protocol details may differ from the current Graphify implementation.
- Read interception can be invasive and must be strictly opt-in.
- `add`, `watch`, and `reflect` may require newer Graphify CLI features not widely available.

## Testing notes

- Test MCP process lifecycle (start, tool call, error, shutdown).
- Test coordinator fallback from MCP to CLI when MCP fails.
- Test read interception only when enabled and safe.

## Notes

MCP integration is a large piece. Consider implementing it as a standalone sub-task before exposing the new tools. Read interception should be gated by config and off by default.
