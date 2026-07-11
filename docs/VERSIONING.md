# Versioning and Dependency Strategy: pi-graphify

This document describes how `pi-graphify` manages its dependency on the external Graphify CLI and how it handles version mismatches.

---

## Supported Graphify range

`pi-graphify` uses a **hybrid strategy** for determining the supported Graphify range:

1. A **hardcoded minimum version** is enforced for safety. This protects the extension from known incompatible Graphify versions.
2. **Runtime capability detection** is used to determine which features are actually available. This is more reliable than version number parsing alone.
3. A **hardcoded maximum version** is only set when a known breaking Graphify release is discovered.

This approach balances maintainability with adaptability. Auto-detecting the full supported range from Graphify’s CLI output is too fragile because the CLI’s help text, flag names, and output format can change between releases.

```typescript
const SUPPORTED_GRAPHIFY_RANGE = {
  min: '2.100.0',     // Hardcoded minimum tested version
  recommended: 'latest', // Best experience
  max: undefined,      // No known breaking upper bound yet
};
```

These values are examples. The exact `min` will be set during implementation based on real Graphify CLI behavior.

---

## Version detection

The extension detects the installed Graphify version in this order:

1. **Environment variable** `GRAPHIFY_PATH` — if set, use this executable.
2. **Config** `graphifyPath` — if set, use this executable.
3. **PATH lookup** — run `which graphify` (Unix) or `where graphify` (Windows).
4. **Common installation paths** — check `~/.local/bin/graphify`, `~/.cargo/bin/graphify`, pipx/uv tool directories.

Once an executable is found, the extension runs:

```bash
graphify --version
```

or falls back to:

```bash
graphify version
```

If neither works, the version is reported as `unknown` and the extension enters best-effort mode.

---

## Installation method detection

The extension attempts to detect how Graphify was installed so it can suggest the correct update command:

| Method | Detection | Update command |
|---|---|---|
| uv tool | `uv tool list` includes graphifyy | `uv tool install --upgrade graphifyy` |
| pipx | `pipx list` includes graphifyy | `pipx upgrade graphifyy` |
| pip user | Executable in pip user bin | `pip install --upgrade graphifyy` |
| pip system | Executable in system site | `pip install --upgrade graphifyy` or system package manager |
| cargo | Binary from `cargo install` | `cargo install fallow-cli` (if applicable) |
| unknown | Cannot determine | `pip install --upgrade graphifyy` or `uv tool install --upgrade graphifyy` |

The update command is shown to the user, never executed automatically.

---

## Version mismatch handling

### Graphify missing

- Disable all Graphify tools.
- Show a notification with installation instructions.
- Keep the session alive. The extension is otherwise inert.

### Version below minimum

- Disable features that require the minimum version.
- Show a warning with the detected version, supported range, and update command.
- Basic query/explain may still work if the CLI contract is compatible.

### Version above supported range

- If the extension has a known max version and the installed version exceeds it, disable features with known breaking changes.
- Show a warning asking the user to update `pi-graphify` if a newer version supports it.
- Log the issue for debugging.

### Version unknown

- Enter best-effort mode.
- Assume basic CLI compatibility.
- Do not claim to support advanced features.

### Feature-specific detection

Some features are gated by capability checks rather than strict version checks. For example:

- If `graphify --help` does not list `affected`, the `graphify_affected` tool is disabled.
- If the MCP server does not expose `shortest_path`, the coordinator falls back to CLI for that operation.

This makes the extension resilient to partial CLI support.

---

## Runtime capability detection

In addition to the hardcoded minimum version, the extension probes the installed Graphify CLI for capabilities. This is more robust than relying solely on version numbers.

### How capability detection works

1. **Version check** — If the version is below `min`, disable advanced features and warn.
2. **Help parsing** — Run `graphify --help` and parse the available subcommands.
3. **Feature probing** — For borderline features, run a lightweight command (e.g., `graphify affected --help`) to confirm the feature exists.
4. **MCP discovery** — If MCP is requested, attempt to start the server and list available tools.

### Why not fully auto-detect the range?

Fully auto-detecting the supported version range from the CLI is fragile because:
- Help text and flag names change.
- A command may exist but behave differently than expected.
- Subtle breaking changes (e.g., output format) are not visible in `--help`.

The hardcoded minimum is a safety guard. The capability detection widens support within that guard.

### Example

```typescript
const capabilities: GraphifyCapabilities = {
  query: semver.gte(version, '2.0.0'),
  path: semver.gte(version, '2.0.0'),
  affected: hasCommand('affected'),  // runtime probe
  reflect: hasCommand('reflect'),      // runtime probe
  mcp: canStartMcpServer(),            // runtime probe
};
```

If a feature probe fails, only that feature is disabled. The rest of the extension continues to work.

---

## Capability matrix

The extension maintains a mapping of Graphify versions to features. This is used as an initial filter before runtime probing.

| Feature | Min CLI version | Runtime probe | Notes |
|---|---|---|---|
| `build` | 2.0.0 | `graphify build --help` | Core command. |
| `query` | 2.0.0 | `graphify query --help` | Core command. |
| `path` | 2.0.0 | `graphify path --help` | Core command. |
| `explain` | 2.0.0 | `graphify explain --help` | Core command. |
| `affected` | 2.50.0 | `graphify affected --help` | Example threshold. |
| `reflect` | 2.70.0 | `graphify reflect --help` | Example threshold. |
| `mcp` | 2.90.0 | Start MCP server and list tools | MCP server support. |
| `--directed` | 2.20.0 | `graphify build --help` mentions `--directed` | Build flag. |
| `--update` | 2.10.0 | `graphify build --help` mentions `--update` | Incremental build. |
| `--watch` | 2.30.0 | `graphify watch --help` | File watcher. |

These versions are illustrative. The actual values will be validated against the real Graphify CLI during implementation.

---

## Update handling

### What the extension does

- Detect installed version.
- Compare to supported range.
- Notify user if an update is recommended.
- Provide the exact update command.

### What the extension does NOT do

- Auto-update Graphify.
- Install Graphify automatically (with one exception: it may suggest the install command).
- Modify the user’s system packages without explicit action.

### User-initiated update

A user can run:

```text
/graphify-update
```

or the agent can call `graphify_update`. This tool runs the detected update command with the user’s confirmation. It is only available in trusted projects and may require elevated permissions depending on the installation method.

### Extension self-update

`pi-graphify` itself is updated through `pi update npm:pi-graphify`, not through Graphify. The extension’s npm version is independent of the Graphify CLI version.

---

## Backwards compatibility

### For `pi-graphify` users

- Minor and patch releases of `pi-graphify` maintain backward compatibility with existing config and tool schemas.
- Major releases may change tool names, parameters, or config options.
- The supported Graphify CLI range may be widened in minor/patch releases.

### For Graphify CLI users

- `pi-graphify` supports a range of Graphify CLI versions.
- New Graphify CLI features may not be available until `pi-graphify` is updated to expose them.
- Breaking Graphify CLI changes may require a major or minor `pi-graphify` release.

---

## Release cadence

### Graphify CLI releases

Graphify releases independently. The `pi-graphify` maintainers will:
- Test new Graphify versions.
- Update the capability matrix.
- Release a new `pi-graphify` version if needed.

### pi-graphify releases

- Patch releases: bug fixes, doc updates, dependency updates.
- Minor releases: new tools/commands, new Graphify CLI support, non-breaking features.
- Major releases: breaking changes to public API, removal of tools, changes to default behavior.

---

## Telemetry and logging

Version mismatches and capability failures are logged at the `warning` level. No data is sent to remote servers. Logs are local to the Pi session and can be used to diagnose issues.

---

## Open questions

1. Should the extension pin a maximum Graphify version to avoid surprises from upstream CLI changes?
2. Should the extension bundle a known-good Graphify CLI version in the future?
3. How should the extension handle Graphify installed from a Git branch or source build?

These will be resolved during implementation and testing.
