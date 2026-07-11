# Project Standards

This document defines project-level standards for `pi-graphify`. It is public and tracked in the repo. User-specific conventions should go in an untracked [`AGENTS.local.md`](AGENTS.local.md) file.

---

## Project structure

```
extensions/         # Pi registration code only
src/                # Core implementation
  backends/         # Graphify CLI and MCP backends
  commands/         # Slash command definitions
  tools/            # LLM tool definitions
  coordinator.ts    # Backend routing and normalization
  config.ts         # Configuration loading
  graphify.ts       # Graphify CLI helpers
  state.ts          # Session state
  version.ts        # Version detection and compatibility
  watcher.ts        # File watcher
.github/workflows/  # CI/CD
```

No build step is required. Pi loads TypeScript directly via jiti.

---

## Coding standards

### TypeScript

- Use strict TypeScript.
- Prefer `type` imports for types.
- Use `.js` extensions in imports (NodeNext module resolution).
- Avoid `any`. Use `unknown` when the type is genuinely unknown.
- Keep functions small and focused.

### Formatting

- 2-space indentation (enforced by Biome).
- No trailing whitespace.
- LF line endings in the repo (Git handles CRLF on Windows via `core.autocrlf`).

### Linting

- All code must pass `npm run lint`.
- Prefer auto-fixing with `npm run lint:fix`.

---

## Dependencies

### Pi core packages

Pi core packages are `peerDependencies` with `"*"` range. They are provided by Pi at runtime.

```json
"peerDependencies": {
  "@earendil-works/pi-agent-core": "*",
  "@earendil-works/pi-ai": "*",
  "@earendil-works/pi-coding-agent": "*",
  "@earendil-works/pi-tui": "*",
  "typebox": "*"
}
```

They must be listed as optional peers:

```json
"peerDependenciesMeta": {
  "@earendil-works/pi-coding-agent": { "optional": true }
}
```

### Runtime dependencies

Third-party packages used at runtime belong in `dependencies`.

### Dev dependencies

Type definitions, linters, and type-checking tools belong in `devDependencies`.

---

## Module boundaries

- `extensions/` — Only Pi registration code. No business logic.
- `src/coordinator.ts` — The only place backend selection happens.
- `src/backends/` — Backend-specific code. No Pi imports.
- `src/tools/` — Tool definitions. Each calls the coordinator.
- `src/commands/` — Command definitions. Each calls the coordinator.
- `src/config.ts` — Pure config loading. No Pi imports.
- `src/state.ts` — Session state.
- `src/watcher.ts` — File watcher.
- `src/version.ts` — Version detection and compatibility.

---

## Conventional commits

All commits must follow the standards defined in [RELEASE.md](../RELEASE.md). In summary, use [Conventional Commits](https://www.conventionalcommits.org/) with one of these prefixes:

| Prefix | Use for |
|---|---|
| `feat:` | New user-facing tool, command, or feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring with no behavior change |
| `test:` | Tests |
| `chore:` | Maintenance, dependency updates, cleanup |
| `ci:` | CI/CD changes |

Breaking changes use `!` or `BREAKING CHANGE:` in the body.

---

## Testing

- All new tools and commands should have tests where practical.
- Run `npm run typecheck` and `npm run lint` before committing.
- Integration tests should use the `CliBackend` with a mock or stubbed CLI.

---

## Security

- Use `execFile` with argument arrays, never `exec` with shell strings.
- Validate all paths relative to the project root.
- Do not auto-run expensive operations (full builds, semantic extraction).
- Treat Graphify output as text; never re-execute it.
- Respect project trust for project-local config and watchers.

---

## Documentation

- Design docs live in [`docs/`](./).
- Release standards live in [`RELEASE.md`](../RELEASE.md).
- Agent context lives in [`AGENTS.md`](../AGENTS.md).
- User-specific conventions live in untracked [`AGENTS.local.md`](../AGENTS.local.md).

All public docs should be clear, accurate, and maintained as the project changes.

---

## Verification commands

```bash
npm run typecheck
npm run lint
npm run lint:fix
npm audit --audit-level=moderate
```

Run all of them before opening a pull request or pushing to `main`.
