# pi-graphify

A production-quality [pi](https://pi.dev) extension for [Graphify](https://github.com/Graphify-Labs/graphify).

This extension brings Graphify knowledge graph capabilities into your Pi sessions, making it easy to query, explore, and update codebase graphs without leaving the agent.

> ⚠️ **Work in progress** — this package is in early development. The public API, tools, and commands will evolve as the extension matures toward a stable 1.0 release.

## Quick Start

```bash
# Install from a local path (during development)
pi install .

# Or run ephemerally without installing
pi -e .

# Type check
npm run typecheck

# Lint
npm run lint
```

## What's Included

```
pi-graphify/
├── extensions/
│   └── index.ts          # Extension entry point (tools, commands, events)
├── src/                   # Core implementation
├── package.json           # Pi manifest + npm config
├── tsconfig.json          # TypeScript config (type checking only)
├── biome.json             # Linter/formatter config
├── .gitignore
├── LICENSE
├── CHANGELOG.md
├── RELEASE.md             # Versioning and release standards
├── AGENTS.md              # Agent context / development conventions
└── README.md
```

## Package Structure

### Extensions (`extensions/`)

TypeScript modules that extend pi's behavior with custom tools, slash commands, and event handlers.

### Source (`src/`)

Pi-agnostic implementation logic. The `extensions/` layer imports from here and registers everything with Pi.

## Development

### Requirements

- Node.js 22+
- npm 10+
- pi CLI

### Scripts

| Command | Description |
|---------|-------------|
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | Check lint + formatting (`biome check`) |
| `npm run lint:fix` | Auto-fix lint + formatting issues |
| `npm run format` | Format code only |

### Testing the package

```bash
# Run ephemerally with no other extensions loaded
pi -ne -e . --no-session

# Test a specific tool in print mode
pi -ne -e . --no-session -p "List the available tools."
```

## Publishing

This package is intended for publication to npm so it can be listed on [pi.dev/packages](https://pi.dev/packages). CI/CD workflows for release automation are included under `.github/workflows/`.

See `RELEASE.md` for versioning and release standards.

Before publishing, update:

- `package.json` author and repository fields
- `README.md` with final usage instructions
- `CHANGELOG.md` with release notes

## License

MIT
