# pi-graphify

A [Pi](https://pi.dev) extension that brings [Graphify](https://github.com/Graphify-Labs/graphify) knowledge graph capabilities into your agent sessions.

## Install

```bash
pi install @wwjd/pi-graphify
```

Or run locally during development:

```bash
pi install .
```

## What it does

`pi-graphify` detects the Graphify CLI and a project's `graphify-out/graph.json` graph, then exposes Graphify operations as Pi tools and slash commands. It routes requests through a backend abstraction so the agent can use Graphify without worrying about whether it's talking to the CLI or (in the future) an MCP server.

When a graph is present, the extension also injects a lightweight hint into the system prompt so the agent knows it can ask structural codebase questions via the graph.

## Requirements

- [Graphify](https://github.com/Graphify-Labs/graphify) must be installed and on your `PATH`.
- The project must have a generated graph at `graphify-out/graph.json`.

## Current commands

| Command | Description |
|---|---|
| `/graphify-status` | Check whether a graph exists and whether the Graphify CLI is compatible. |

## Current tools

| Tool | Description |
|---|---|
| `graphify_status` | Check graph presence, path, and Graphify CLI compatibility. |
| `graphify_build` | Build or incrementally update the Graphify knowledge graph. |
| `graphify_query` | Ask a natural-language question against the graph. |
| `graphify_path` | Find the shortest path between two graph nodes. |
| `graphify_explain` | Explain a node and its connections in the graph. |
| `graphify_affected` | Show the blast radius of changes to one or more files. |
| `graphify_version` | Report the installed Graphify version and compatibility status. |

## What's coming

Slash commands for the tools above are planned in the next phase:

- `/graphify-build`
- `/graphify-query`
- `/graphify-path`
- `/graphify-explain`
- `/graphify-affected`
- `/graphify-version`

Later phases will add background file watching, MCP backend support, ecosystem integrations, and release readiness work. See [plan/PLAN.md](plan/PLAN.md) for the full roadmap.

## How it works

1. On session start, the extension detects the installed Graphify version and looks for `graphify-out/graph.json`.
2. If a graph is found, a hint is added to the agent context.
3. Tools and commands route through a coordinator that selects the best available backend.

## Status

This extension is in early development. The public API, tools, and commands will evolve as the extension matures toward a stable 1.0 release.

## Documentation

- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Ecosystem](docs/ECOSYSTEM.md)
- [Versioning](docs/VERSIONING.md)
- [Release standards](RELEASE.md)
- [Agent context](AGENTS.md)

## Development

```bash
npm run typecheck
npm run lint
```

## License

MIT
