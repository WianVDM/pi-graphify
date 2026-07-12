# pi-graphify Implementation Plan

Single source of truth for the phased development of `pi-graphify`. This document stays at a high level; detailed task breakdowns live in per-phase files.

## Current status

- **Active phase:** 4 — Commands
- **Last completed:** Phase 3 — Core tools
- **Last updated:** 2026-07-12
- **Next action:** Implement Phase 4 slash commands (pending explicit approval)
- **Open questions:** None

## Roadmap

| Phase | Title | Status | Goal |
| --- | --- | --- | --- |
| 1 | [Foundation](phase-01-foundation.md) | ✅ Complete | Set up the package, config, CLI discovery, and first status tool |
| 2 | [Backend abstraction](phase-02-backend-abstraction.md) | ✅ Complete | Abstract Graphify behind a stable backend interface and coordinator |
| 3 | [Core tools](phase-03-core-tools.md) | ✅ Complete | Implement query, path, explain, affected, build, version tools with late registration gating |
| 4 | [Commands](phase-04-commands.md) | 🔄 Active | Add slash commands for every core tool |
| 5 | [Automation](phase-05-automation.md) | ⏳ Pending | File watcher, staleness detection, git hook helper, auto-hints |
| 6 | [Advanced features](phase-06-advanced-features.md) | ⏳ Pending | MCP backend, add, watch, reflect, optional read interception |
| 7 | [Ecosystem polish](phase-07-ecosystem-polish.md) | ⏳ Pending | Hermes memory integration, telemetry, diagnostics |
| 8 | [1.0 readiness](phase-08-1-0-readiness.md) | ⏳ Pending | Tests, README, security review, stable config, npm publish |

## Conventions

- **Statuses:** `⏳ Pending`, `🔄 Active`, `✅ Complete`, `🛑 Blocked`.
- **Pass-based refinement:** Each phase file is filled in through multiple vertical-slice passes. Pass 1 = skeleton overview; later passes add depth.
- **Session updates:** Update the **Current status** block at the start and end of every session.
- **Tracked in git:** `plan/` is tracked so it survives across devices, but it is not included in the npm package because `package.json` `files` only lists `src`, `extensions`, `docs`, and selected metadata files.

## References

- [Design](../docs/DESIGN.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Versioning](../docs/VERSIONING.md)
- [Ecosystem](../docs/ECOSYSTEM.md)
- [Planning process](PROCESS.md)
