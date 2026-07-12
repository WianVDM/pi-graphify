# Local Development and Testing Guide

This guide covers how to install and test the local `pi-graphify` extension, plus how to install and uninstall the Graphify CLI for end-to-end verification.

## Prerequisites

- [Pi](https://pi.dev) installed and on your PATH.
- Node.js 20+ and npm.
- Python 3.10+ (only needed when testing with the Graphify CLI).
- [uv](https://docs.astral.sh/uv/) or [pipx](https://pipx.pypa.io/) (recommended for Graphify).

## Install the local pi-graphify extension

From the project root directory, run:

```bash
pi install .
```

This installs the local package into Pi so the extension is loaded on the next Pi session.

To verify the install, start Pi in any project and check that `/graphify-status` autocompletes.

## Automated checks

Before running manual tests, run the static and automated checks:

```bash
npm run typecheck
npm run lint
npm test
npm audit --audit-level=moderate
```

All should pass.

## Install the Graphify CLI

The official PyPI package is **`graphifyy`** (double-y). The CLI command is still `graphify`.

### Recommended: uv

```bash
uv tool install graphifyy
graphify --version
```

### Alternative: pipx

```bash
pipx install graphifyy
graphify --version
```

### Alternative: pip

```bash
pip install graphifyy
graphify --version
```

After installing, `graphify` should be available on your PATH. If it is not, add the tool's bin directory to your PATH (for example, `~/.local/bin` for `uv tool` or `pipx`).

## Build a graph for testing

Phase 3 only adds the tools. The `/graphify-build` command is added in Phase 4, so for now build the graph directly with the Graphify CLI:

```bash
graphify .
```

This creates a `graphify-out/` directory with `graph.json`, `graph.html`, and `GRAPH_REPORT.md`.

Once Phase 4 is complete, `/graphify-build` will be available as an alternative.

## Verify the extension with Graphify installed

1. Start Pi in a project with a built graph.
2. You should see a notification: `Graphify graph ready: ...`.
3. The supported tools should be available to the LLM. You can verify by asking: "What graphify tools are available?" or by checking the system prompt tool list.
4. Test a tool by asking: "Use the graphify graph to explain how auth works in this codebase."

## Verify the extension without Graphify

1. Uninstall Graphify (see below).
2. Start Pi in a project.
3. You should see a warning: `Graphify CLI was not detected on PATH...`.
4. No `graphify_*` tools should be available to the LLM.
5. `/graphify-status` should still work and report that no graph was found.

## Uninstall the Graphify CLI

### uv

```bash
uv tool uninstall graphifyy
```

### pipx

```bash
pipx uninstall graphifyy
```

### pip

```bash
pip uninstall graphifyy
```

After uninstalling, run `graphify --version` to confirm it is no longer on PATH.

## Uninstall the local pi-graphify extension

```bash
pi uninstall npm:@wwjd/pi-graphify
```

Or remove the package manually from Pi's package directory if you installed it locally.

## Troubleshooting

| Problem | Solution |
|---|---|
| `graphify` command not found after install | Ensure the tool bin directory is on your PATH. For `uv tool`, try `uv tool update-shell`. |
| Pi does not load the extension | Run `pi --version` and confirm the package is listed in `pi packages`. Try `/reload`. |
| Extension shows old version after changes | Run `pi install .` again, then start a fresh Pi session. |
| `graphify_status` returns "No Graphify graph found" | Build the graph first with `graphify .` (the `/graphify-build` command is coming in Phase 4). |

## References

- [Graphify repository](https://github.com/Graphify-Labs/graphify)
- [graphifyy on PyPI](https://pypi.org/project/graphifyy/)
- [Pi extensions documentation](https://pi.dev/docs/extensions)
