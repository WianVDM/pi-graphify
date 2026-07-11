# Phase 7 — Ecosystem polish

**Status:** ⏳ Pending  
**Plan pass:** 3

## Goal

Integrate with the broader Pi extension ecosystem and improve observability, diagnostics, and memory.

## In scope

- Hermes memory integration (persist graph lessons / discoveries)
- Telemetry and logging (local-only)
- Diagnostics tools (`graphify_diagnostics`)
- Better error messages and user guidance
- Update notification helpers
- Performance basics (timeouts, caching, result size limits)

## Out of scope

- Replacing other memory extensions
- Remote telemetry or data collection
- Bundling Graphify
- Cross-repo graph customization beyond Graphify’s own support

## Key deliverables

- `src/memory.ts` or memory bridge helpers
- `src/telemetry.ts` (local logging only)
- `src/tools/diagnostics.ts`
- `src/commands/diagnostics.ts`
- Improved error UX in `src/errors.ts`
- Updated documentation

## Dependencies

- **Phase 3 — Core tools** provides the graph operations worth persisting to memory.
- **Phase 6 — Advanced features** may expose richer integration points.

## Risks

- Hermes memory API may not be stable or may not be installed.
- Telemetry/logging could leak sensitive data if not carefully designed.
- Diagnostics tools may expose too much internal state.

## Testing notes

- Test Hermes memory integration only when the extension is present; verify graceful degradation when absent.
- Test telemetry output is local and contains no sensitive paths.
- Test diagnostics tool returns accurate version and capability info.

## Task breakdown

- [ ] Design memory bridge for persisting graph discoveries to Hermes memory
- [ ] Implement `src/memory.ts` with optional Hermes integration
- [ ] Implement `src/telemetry.ts` for local-only logging
- [ ] Implement `graphify_diagnostics` tool and `/graphify-diagnostics` command
- [ ] Improve error messages and add actionable guidance
- [ ] Add update notification helpers for Graphify and pi-graphify
- [ ] Implement performance limits (result size caps, timeouts)
- [ ] Ensure optional integrations degrade gracefully when not installed
- [ ] Test Hermes memory integration when available
- [ ] Test telemetry output contains no sensitive data
- [ ] Verify `npm run typecheck` and `npm run lint` pass

## Completion criteria

- [ ] Graphify discoveries (e.g., query results, path explanations, affected files) can be saved to Hermes memory when the extension is available
- [ ] Local telemetry/logging is useful for debugging
- [ ] Diagnostics tool reports version, capabilities, and backend status
- [ ] Error messages guide users toward the fix
- [ ] Extension type-checks and lints cleanly

## Notes

Hermes memory integration should be optional: if the extension is not installed, `pi-graphify` continues to work normally.
