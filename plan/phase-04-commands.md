# Phase 4 — Commands

**Status:** ⏳ Pending  
**Plan pass:** 2

## Goal

Add user-facing slash commands for every core tool so interactive users can invoke Graphify operations directly.

## In scope

- `/graphify-build`
- `/graphify-query`
- `/graphify-path`
- `/graphify-explain`
- `/graphify-affected`
- `/graphify-status` (upgrade from Phase 1 stub)
- `/graphify-version` (new)
- Command argument parsing and validation
- Shared command handler helpers that delegate to the coordinator

## Out of scope

- New LLM tools (Phase 3 already done)
- File watcher commands (Phase 5)
- MCP-specific commands (Phase 6)
- Ecosystem commands like `/graphify-sync-memory` (Phase 7)

## Key deliverables

- `src/commands/build.ts`
- `src/commands/query.ts`
- `src/commands/path.ts`
- `src/commands/explain.ts`
- `src/commands/affected.ts`
- `src/commands/status.ts`
- `src/commands/version.ts`
- `src/commands/index.ts` registration helper
- Updated `extensions/index.ts`

## Completion criteria

- [ ] Every core tool has a corresponding slash command
- [ ] Commands reuse the same coordinator methods as tools
- [ ] Commands produce clear, actionable output in the UI
- [ ] Invalid arguments are handled with usage hints
- [ ] Extension type-checks and lints cleanly

## Dependencies

- **Phase 3 — Core tools** must be complete. Commands are thin wrappers around the same coordinator operations.

## Risks

- Commands may accidentally duplicate tool logic if not carefully implemented.
- Argument parsing for free-form queries may be tricky.
- UI output may be too verbose for some operations.

## Testing notes

- Test command argument parsing independently.
- Verify each command delegates to the same coordinator method as the corresponding tool.
- Test error handling and usage hints.

## Notes

Commands should be thin wrappers around the coordinator. Avoid duplicating logic between tools and commands.
