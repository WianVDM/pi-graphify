# Design Document: pi-graphify

## Executive summary

`pi-graphify` integrates the [Graphify](https://github.com/Graphify-Labs/graphify) knowledge graph ecosystem into [Pi](https://pi.dev) as a native extension. It exposes Graphify capabilities through Pi tools, slash commands, and session lifecycle hooks, and it abstracts over multiple Graphify interfaces (CLI and MCP) so that the Pi agent can use Graphify without caring how it is installed.

The design is intentionally ecosystem-aware: it works alongside memory extensions like `pi-hermes-memory`, code intelligence extensions like `pi-fallow`, and any other Pi package without duplicating their responsibilities.

For deeper detail, see:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — backend abstraction, component design, and data flow
- [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) — integration with other Pi extensions
- [docs/VERSIONING.md](docs/VERSIONING.md) — Graphify dependency and compatibility strategy

---

## Vision

Make Graphify a first-class Pi citizen. A user should be able to open a Pi session in a project that has Graphify installed, ask codebase questions, and have the agent automatically use the knowledge graph when it is the right tool. Manual Graphify commands should still be available, but they should not be the default path for common questions.

The experience should feel similar to how `pi-hermes-memory` makes persistent memory feel native: present in the background, available through tools, and surfaced automatically when relevant.

---

## Design principles

1. **Agent-first**
   The LLM should discover and call Graphify capabilities through typed tools. The user should not have to remember command syntax.

2. **Backend abstraction**
   The extension supports both the Graphify CLI and the Graphify MCP server behind a single interface. Callers do not choose the backend; the extension picks the best available one.

3. **Defensive compatibility**
   Graphify is an external tool with its own release cycle. The extension detects the installed version, compares it to a supported range, and degrades gracefully when there is a mismatch.

4. **Progressive automation**
   Start with manual tools, then add context hints, then background rebuilds, then optional interception. Each layer is configurable and can be disabled.

5. **Safe defaults**
   Do not auto-run expensive operations. Code-only incremental rebuilds are safe; LLM-based semantic extraction is explicit. Do not auto-update Graphify without user confirmation.

6. **Ecosystem composable**
   Work with, not against, other Pi extensions. Store durable lessons in memory extensions. Coexist with code intelligence extensions. Respect project trust and provider settings.

7. **Integration-ready**
   Third-party integrations (e.g., with `pi-hermes-memory`) are optional and not part of the core implementation. The extension exposes well-defined hooks so that other extensions can integrate with it without tight coupling.

8. **Full ecosystem coverage**
   Expose the useful Graphify surface: build, query, path, explain, affected, add, watch, reflect, and diagnostics. Do not build a thin wrapper around only `query`.

---

## User experience

### Ideal flow

1. User opens a project in Pi.
2. `pi-graphify` detects `graphify-out/graph.json` and the installed Graphify version.
3. If a graph exists, the system prompt gets a hint to prefer graph tools for codebase questions.
4. User asks: “How does auth flow to the database?”
5. The agent calls `graphify_query` and receives a scoped subgraph.
6. While the user edits code, the graph is incrementally rebuilt in the background (if enabled).
7. The user rarely types `/graphify`.

### Fallback flow

1. User opens a project with no graph or an outdated Graphify version.
2. The extension explains the situation and offers `/graphify-build` or `/graphify-status`.
3. The agent or user triggers the build.
4. The extension reports success or failure clearly.

### Version mismatch flow

1. Extension detects Graphify 1.x when 2.x is expected.
2. It notifies the user and disables features that require 2.x.
3. It provides the exact command to update Graphify.
4. Basic query/explain still work if the CLI contract is compatible.

---

## Feature surface

### Tools

| Tool | Purpose |
|---|---|
| `graphify_status` | Check whether a graph exists and whether the CLI is compatible. |
| `graphify_build` | Build or incrementally update the graph. |
| `graphify_query` | Natural-language graph traversal. |
| `graphify_path` | Shortest path between two concepts. |
| `graphify_explain` | Explain a node and its connections. |
| `graphify_affected` | Show blast radius of a change. |
| `graphify_add` | Add a URL or document to the corpus. |
| `graphify_watch` | Start or stop the background file watcher. |
| `graphify_reflect` | Refresh LESSONS.md from saved query results. |
| `graphify_version` | Report installed Graphify version and compatibility status. |

### Commands

| Command | Purpose |
|---|---|
| `/graphify-status` | Show graph status and compatibility. |
| `/graphify-build` | Build or update the graph. |
| `/graphify-query` | Run a query. |
| `/graphify-path` | Trace a path. |
| `/graphify-explain` | Explain a node. |
| `/graphify-affected` | Show affected nodes. |
| `/graphify-watch` | Toggle file watcher. |
| `/graphify-install-hook` | Install a post-commit rebuild hook. |
| `/graphify-diagnose` | Run graph health / extension diagnostics. |
| `/graphify-version` | Show Graphify version and backend details. |

### Events

| Event | Behavior |
|---|---|
| `session_start` | Detect graph, detect Graphify version, start watcher if configured. |
| `before_agent_start` | Inject graph hint if a graph exists. |
| `session_shutdown` | Stop watcher, close MCP connection. |
| `tool_call` (optional future) | Nudge read/grep toward graph query when appropriate. |

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full component design.

At a high level, the extension is layered:

```
Pi Agent
    │
    ▼
Extensions API  (extensions/index.ts)
    │
    ├─ Tool registration
    ├─ Command registration
    └─ Event handlers
    ▼
Coordinator     (src/coordinator.ts)
    │
    ├─ Backend selector (CLI vs MCP)
    ├─ Version manager
    ├─ State manager
    └─ Feature capability map
    ▼
Graphify Backend
    ├─ CliBackend    (src/backends/cli.ts)
    └─ McpBackend    (src/backends/mcp.ts)
```

All Graphify operations go through the coordinator, which picks the backend, checks capabilities, and normalizes results. No tool or command talks directly to the CLI or MCP server.

---

## Graphify dependency

See [docs/VERSIONING.md](docs/VERSIONING.md) for the detailed compatibility strategy.

### Supported range

The extension declares a supported Graphify version range (e.g., `>= 2.100.0`). This range is checked at session start and before each operation if the version is unknown.

### Detection

The extension finds Graphify by:
1. Checking the `GRAPHIFY_PATH` environment variable.
2. Searching `PATH` for the `graphify` executable (`which` / `where`).
3. Checking common installation locations (uv tool, pipx, pip user bin).

### Version command

`graphify --version` or `graphify version` is used to determine the installed version. If the command fails, the extension falls back to trying CLI operations in compatibility mode.

### Mismatch handling

| Scenario | Behavior |
|---|---|
| Graphify missing | Disable tools, show install instructions, keep session alive. |
| Version below minimum | Disable advanced features, warn user, suggest update command. |
| Version above maximum | Disable features with known breaking changes, warn user, log telemetry. |
| Version unknown | Run in best-effort mode; assume basic CLI compatibility. |
| Feature missing | Disable that specific feature; other tools continue working. |

### Updates

The extension never auto-updates Graphify. It can:
- Detect that an update is available.
- Show the exact update command for the detected installation method.
- Let the agent or user run the update via a tool/command if they choose.

For the hybrid version-detection strategy (hardcoded minimum + runtime capability probes), see [docs/VERSIONING.md](docs/VERSIONING.md).

---

## Ecosystem integration

See [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) for detailed integration points.

### With `pi-hermes-memory`

Complementary. Graphify provides project structure context; Hermes provides durable agent/user memory. The extension may write durable lessons to Hermes memory when graph queries produce reusable insights or corrections.

This integration is **not part of the initial implementation**. It will be added later via the integration hook architecture described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### With `pi-fallow`

Coexistence. Fallow is useful for TypeScript/JavaScript code intelligence; Graphify is useful for project-wide structural knowledge. Both can run in the same session without conflict.

### With provider/auth extensions

The extension does not manage API keys or providers. It relies on Graphify to read `GEMINI_API_KEY` / `GOOGLE_API_KEY` for semantic extraction, and on Pi to manage LLM provider auth for the agent itself.

---

## Security model

1. **Path validation** — All paths resolved relative to project root; no traversal.
2. **No shell injection** — Use `execFile` with argument arrays.
3. **User confirmation for expensive ops** — Full builds and semantic extraction require explicit action.
4. **Output sanitization** — Graphify output is treated as text; never re-executed.
5. **Project trust** — Project-local config and auto-watch only on trusted projects.
6. **URL validation** — URLs are validated before `graphify add`.

---

## Error handling

| Scenario | Behavior |
|---|---|
| Graphify missing | Clear install instructions; extension stays loaded. |
| Version incompatible | Feature matrix adjusted; user notified. |
| Graph missing | Offer to build; do not crash. |
| Build fails | Return error to agent with stderr. |
| Watcher fails | Log warning; disable watcher; continue. |
| MCP connection fails | Fall back to CLI automatically. |
| Query no results | Clear message; agent can try other tools. |

---

## Out of scope (for v1)

- Rewriting Graphify in TypeScript.
- Bundling Python or graphify dependencies.
- Auto-running LLM-based semantic extraction on every save.
- Auto-updating Graphify without user confirmation.
- Replacing other memory or intelligence extensions.
- Hosting a persistent public MCP server.
- Cross-repo graph customization beyond what Graphify already supports.

---

## Roadmap

### Phase 1 — Foundation ✅
- Project setup, config loader, CLI discovery, status tool, version detection.

### Phase 2 — Backend abstraction
- Coordinator, `CliBackend`, backend interface, capability matrix.

### Phase 3 — Core tools
- Build, query, path, explain, affected, version tools.

### Phase 4 — Commands
- Slash commands for all core tools.

### Phase 5 — Automation
- File watcher, staleness detection, git hook helper, auto-hints.

### Phase 6 — Advanced features
- MCP backend, `add`, `watch`, `reflect`, optional read interception.

### Phase 7 — Ecosystem polish
- Hermes memory integration, telemetry/logging, diagnostics.

### Phase 8 — 1.0 readiness
- Tests, README, security review, stable config, npm publish, gallery.

---

## Success criteria for 1.0

- [ ] User can install `pi-graphify` and use graph tools against an existing graph.
- [ ] Agent automatically prefers graph tools for codebase questions when a graph exists.
- [ ] Extension handles missing or outdated Graphify gracefully.
- [ ] Graph can be rebuilt and queried without leaving Pi.
- [ ] File watcher can optionally auto-update code-only graphs.
- [ ] Backend abstraction supports CLI and MCP.
- [ ] Full test coverage and passing CI.
