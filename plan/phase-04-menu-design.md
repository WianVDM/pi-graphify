# Phase 4 Menu Design

This document describes the design of the `/graphify` unified command menu. It complements [`phase-04-commands.md`](phase-04-commands.md) and explains the registry, menu rendering, fallback behavior, and how to add new commands without rewriting the menu.

## Why a unified menu

Pi already exposes registered slash commands through its own command palette, but a dedicated `/graphify` menu provides:

- A single entry point users can remember.
- Contextual descriptions for each Graphify operation.
- Capability-aware filtering so users only see commands their Graphify installation supports.
- A native Pi overlay experience in TUI mode.

The menu is not a replacement for the individual `/graphify-*` commands; those remain available for power users and direct typing.

## Command registry

All commands are defined by a single `CommandDefinition` object. The registry is the only place that lists every command, so the slash-command registration and the menu both read from it.

### `CommandDefinition`

```typescript
export interface CommandDefinition {
  /** Slash command name, e.g. "graphify-build". */
  name: string;

  /** Menu label, e.g. "Build graph". */
  label: string;

  /** Description shown in the menu and in Pi's command list. */
  description: string;

  /** Required Graphify capability. The menu filters items based on this. */
  feature: keyof GraphifyCapabilities;

  /** Usage string shown when arguments are invalid. */
  usage: string;

  /** How the menu collects arguments. */
  argMode: "none" | "input" | "flags";

  /** Title for ctx.ui.input when argMode is "input" or "flags". */
  prompt?: string;

  /** Placeholder for ctx.ui.input. */
  placeholder?: string;

  /** Execute the command with the given raw argument string. */
  execute: CommandExecutor;
}
```

### `CommandExecutor`

```typescript
export type CommandExecutor = (
  ctx: CommandContext,
  getCoordinator: CoordinatorProvider,
  args: string,
) => Promise<void>;
```

`CommandContext` is a narrow subset of `ExtensionCommandContext` that includes only what executors need: `cwd`, `ui.notify`, `ui.input`, `hasUI`, `mode`, and `isProjectTrusted`. This makes executors easy to test with a mock context.

## Registry structure

`src/commands/registry.ts` imports each command module and exports the array:

```typescript
import { buildCommand } from "./build.js";
import { queryCommand } from "./query.js";
// ...

export const graphifyCommands: CommandDefinition[] = [
  buildCommand,
  queryCommand,
  pathCommand,
  explainCommand,
  affectedCommand,
  statusCommand,
  versionCommand,
];

export function getAvailableCommands(
  coordinator: GraphifyCoordinator | null,
  commands: CommandDefinition[] = graphifyCommands,
): CommandDefinition[] {
  if (!coordinator) return [];
  return commands.filter((command) => coordinator.supports(command.feature));
}
```

Adding a new command later requires only three steps:

1. Create `src/commands/newcmd.ts` and export a `CommandDefinition` object.
2. Import it in `src/commands/registry.ts` and add it to `graphifyCommands`.
3. Add tests for the executor and, if needed, update menu tests to verify the new item appears.

No changes are needed in `src/commands/index.ts`, `src/commands/menu.ts`, or `extensions/index.ts` because they all derive from the registry.

## Menu rendering

### TUI mode: overlay `SelectList`

In TUI mode, the menu renders as an overlay using `ctx.ui.custom(..., { overlay: true })`. The component uses:

- `Container` to stack elements vertically.
- `DynamicBorder` for the top and bottom borders, styled with the active theme's `accent` color.
- `Text` for the title and footer hint.
- `SelectList` for the selectable menu items, with theme-aware selected / description / scroll colors.

```typescript
const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
  const container = new Container();
  container.addChild(new DynamicBorder((str) => theme.fg("accent", str)));
  container.addChild(new Text(theme.fg("accent", theme.bold("Graphify"))));

  const items = availableCommands.map((command) => ({
    value: command.name,
    label: command.label,
    description: command.description,
  }));

  const selectList = new SelectList(items, Math.min(items.length, 10), {
    selectedPrefix: (text) => theme.fg("accent", text),
    selectedText: (text) => theme.fg("accent", text),
    description: (text) => theme.fg("muted", text),
    scrollInfo: (text) => theme.fg("dim", text),
    noMatch: (text) => theme.fg("warning", text),
  });

  selectList.onSelect = (item) => done(item.value);
  selectList.onCancel = () => done(null);
  container.addChild(selectList);
  container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel")));
  container.addChild(new DynamicBorder((str) => theme.fg("accent", str)));

  return {
    render: (width) => container.render(width),
    invalidate: () => container.invalidate(),
    handleInput: (data) => {
      selectList.handleInput(data);
      tui.requestRender();
    },
  };
}, { overlay: true });
```

The footer hint matches the style used by Pi's built-in selectors.

### RPC mode: native `ctx.ui.select`

In RPC mode, `ctx.ui.custom` components are not available, but `ctx.ui.select` is. The menu falls back to a simple selector:

```typescript
const choice = await ctx.ui.select(
  "Graphify",
  availableCommands.map((command) => `${command.label}: ${command.description}`),
);
```

The selected string is mapped back to the corresponding `CommandDefinition`.

### Non-UI mode: silent no-op

In `--print` or `--json` mode, `ctx.hasUI` is `false`. The `/graphify` command is a UI convenience, so it returns silently. Users in these modes can still invoke the individual `/graphify-*` commands directly if the CLI/RPC interface supports them.

## Menu execution flow

After the user selects a command, the menu handles three cases:

1. **No arguments (`argMode: "none"`)**: execute immediately.

   ```typescript
   await selectedCommand.execute(ctx, getCoordinator, "");
   ```

2. **Free-form input (`argMode: "input"`)**: prompt for input, then execute.

   ```typescript
   const input = await ctx.ui.input(selectedCommand.prompt, selectedCommand.placeholder);
   if (input === undefined) return; // cancelled
   await selectedCommand.execute(ctx, getCoordinator, input);
   ```

3. **Flags (`argMode: "flags"`)**: prompt for flags, then execute.

   ```typescript
   const input = await ctx.ui.input(selectedCommand.prompt, selectedCommand.placeholder);
   if (input === undefined) return; // cancelled
   await selectedCommand.execute(ctx, getCoordinator, input);
   ```

The executor is responsible for parsing the raw argument string. This keeps the menu generic and makes executors usable from both the menu and direct slash commands.

## Capability-aware filtering

The menu must never show commands the current Graphify installation cannot run. The menu builds its item list from `getAvailableCommands(coordinator, graphifyCommands)`, which filters by `coordinator.supports(command.feature)`.

If the coordinator is not initialized (e.g., Graphify is not installed), the menu shows a warning and returns. The menu is not a tool-discovery mechanism; it is a launcher for available commands.

## Fallback summary

| Mode | Behavior |
| --- | --- |
| TUI (`ctx.mode === "tui"`) | Overlay `SelectList` menu with theme-aware borders |
| RPC (`ctx.mode === "rpc"`) | Native `ctx.ui.select` selector |
| Print / JSON (`ctx.hasUI === false`) | Return silently; individual `/graphify-*` commands remain usable |

## Testing strategy

The menu is tested with a mock context that captures UI calls.

- `buildMenuItems(commands)` returns `SelectItem[]` and is tested with available and unavailable commands.
- `showGraphifyMenu` is tested by mocking `ctx.ui.custom`, `ctx.ui.select`, and `ctx.ui.input`.
- TUI tests verify the overlay factory is called, the correct items are passed, and selection invokes the executor.
- RPC tests verify `ctx.ui.select` is called and the result is mapped to the executor.
- Non-UI tests verify no UI methods are called and no error is thrown.

Because the menu delegates to the same executors used by individual slash commands, the executor behavior does not need to be retested in menu tests.

## Conventions

- Keep `label` short and imperative: "Build graph", "Query graph".
- Keep `description` concise and descriptive: "Ask a natural-language question against the graph".
- Use `argMode: "input"` for commands that accept a single free-form string.
- Use `argMode: "flags"` for commands that accept optional flags.
- Use `argMode: "none"` for commands that need no arguments.
- Always provide a `usage` string shown on invalid input.
- Always set `feature` to the matching `GraphifyCapabilities` key so the menu can filter correctly.
