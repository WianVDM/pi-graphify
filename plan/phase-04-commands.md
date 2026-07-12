# Phase 4 — Commands

**Status:** ✅ Complete  
**Plan pass:** 4

## Current standards pass

All standards-pass items are resolved:

1. **Magic numbers** — `MAX_MENU_VISIBLE_ITEMS` replaces the literal `10` in `src/commands/menu.ts`; `TRUNCATION_TEST_OUTPUT_LENGTH` and `TRUNCATION_TEST_ASSERTION_LIMIT` replace `2000`/`1100` in `src/commands/commands.test.ts`.
2. **Duplicated usage strings** — `BUILD_USAGE`, `PATH_USAGE`, and `AFFECTED_USAGE` constants are now shared between the `CommandDefinition` metadata and the parser usage errors in `build.ts`, `path.ts`, and `affected.ts`.
3. **Project-wide static analysis** — `fallow` was run. The two new-file issues (`MAX_NOTIFICATION_LENGTH` and `FlagValueError` unused exports) were fixed by removing the exports. Remaining issues are pre-existing in `src/coordinator.ts` and `package.json` and are out of scope for this pass.
4. **Final documentation review** — `README.md`, `docs/TESTING.md`, and the plan files were reviewed; the plan status was updated to mark Phase 4 complete.

Automated checks (`npm run typecheck`, `npm run lint`, `npm test`) all pass. The phase can be marked fully complete.

## Goal

Add user-facing slash commands for every core tool so interactive users can invoke Graphify operations directly, and provide a unified `/graphify` menu that feels native to Pi.

## In scope

- Individual slash commands: `/graphify-build`, `/graphify-query`, `/graphify-path`, `/graphify-explain`, `/graphify-affected`, `/graphify-status`, `/graphify-version`
- Unified `/graphify` overlay menu using Pi’s native `SelectList` component
- TUI overlay menu, RPC selector fallback, and non-UI graceful degradation
- Command registry so new commands can be added in one place
- Shared argument parsing, formatting, and error handling
- Capability checks inside command handlers
- Clear UI notifications with output truncation and error severity

## Out of scope

- New LLM tools (Phase 3 already done)
- File watcher automation (Phase 5)
- MCP-specific commands (Phase 6)
- Ecosystem commands like `/graphify-sync-memory` (Phase 7)

## Key deliverables

- `src/commands/types.ts` — command context, definition, and handler types
- `src/commands/parse.ts` — shared argument parsing utilities (whitespace + quoted tokens)
- `src/commands/format.ts` — pure formatting helpers for command UI output
- `src/commands/build.ts`, `src/commands/query.ts`, `src/commands/path.ts`, `src/commands/explain.ts`, `src/commands/affected.ts`, `src/commands/status.ts`, `src/commands/version.ts` — command executors and metadata
- `src/commands/registry.ts` — single source of truth for all command definitions
- `src/commands/index.ts` — registers all individual slash commands from the registry
- `src/commands/menu.ts` — implements `/graphify` overlay menu and fallbacks
- Updated `extensions/index.ts` (replace inline status command with registration helpers)
- `src/commands/commands.test.ts` and `src/commands/menu.test.ts` — unit tests

## Task breakdown

### 1. Shared command infrastructure

- [x] Create `src/commands/types.ts`
  - [x] Define `CommandContext` with `cwd`, `ui.notify`, `ui.input`, `hasUI`, `mode`, and `isProjectTrusted`
  - [x] Define `CommandExecutor` type: `(ctx: CommandContext, getCoordinator: CoordinatorProvider, args: string) => Promise<void>`
  - [x] Define `CommandDefinition` interface: `name`, `label`, `description`, `feature`, `usage`, `argMode`, `prompt`, `placeholder`, `execute`
  - [x] Re-export `CoordinatorProvider` from `src/coordinator.ts` (move the type there so tools and commands share it)
- [x] Create `src/commands/parse.ts`
  - [x] `splitArgs(args)` — split on whitespace while respecting single and double quotes
  - [x] `parseBooleanFlag(args, flag)` — detect `--flag`; return `{ value, rest }`
  - [x] `parseBooleanFlag(args, flag, true)` — support `--flag=true|false`
  - [x] Reject unknown flags with a clear usage message
  - [x] `usageError(command, usage)` helper returning a formatted usage string
- [x] Create `src/commands/format.ts`
  - [x] `formatResultForCommand(result: GraphifyResult): string` — convert a successful backend result to a UI string, truncating if needed
  - [x] `formatErrorForCommand(error: unknown): { message: string; severity: "warning" | "error" }` — normalize errors
  - [x] `MAX_NOTIFICATION_LENGTH` constant (e.g., 1000 characters) with a clear "... (truncated)" suffix
  - [x] Keep functions pure: formatters return values; they do not call `ctx.ui.notify`

### 2. Command registry

- [x] Create `src/commands/registry.ts`
  - [x] Import each command executor and its metadata from the per-command files
  - [x] Export `graphifyCommands: CommandDefinition[]` as the single source of truth
  - [x] Export `getAvailableCommands(coordinator, commands)` helper to filter commands by capability
- [x] Create each command file (`src/commands/{build,query,path,explain,affected,status,version}.ts`)
  - [x] Export `executeXxx(ctx, getCoordinator, args): Promise<void>`
  - [x] Export a `CommandMetadata` object (or return from a factory) containing `name`, `label`, `description`, `feature`, `usage`, `argMode`, `prompt`, `placeholder`
  - [x] Implement argument parsing, coordinator calls, and error handling in each executor
- [x] Move `CoordinatorProvider` type from `src/tools/index.ts` to `src/coordinator.ts` and re-export it

### 3. Implement individual command executors

- [x] `/graphify-status` (`src/commands/status.ts`)
  - [x] `argMode: "none"`
  - [x] Validate coordinator is initialized
  - [x] Call `coordinator.status({ cwd: ctx.cwd })`
  - [x] Notify info when graph exists; warn when missing
- [x] `/graphify-version` (`src/commands/version.ts`)
  - [x] `argMode: "none"`
  - [x] Call `coordinator.getVersion()`
  - [x] Notify version and compatibility status
- [x] `/graphify-build` (`src/commands/build.ts`)
  - [x] `argMode: "flags"`
  - [x] Parse `--code-only`, `--update`, `--directed`; reject unknown flags
  - [x] Call `coordinator.build({ cwd: ctx.cwd, codeOnly, update, directed })`
  - [x] Respect project trust before running a build
- [x] `/graphify-query` (`src/commands/query.ts`)
  - [x] `argMode: "input"`
  - [x] Treat `args` (trimmed) as the question; validate non-empty
  - [x] Call `coordinator.query({ cwd: ctx.cwd, question: args })`
- [x] `/graphify-path` (`src/commands/path.ts`)
  - [x] `argMode: "input"`
  - [x] Split `args` with `splitArgs`; require exactly two tokens
  - [x] Call `coordinator.path({ cwd: ctx.cwd, source, target })`
- [x] `/graphify-explain` (`src/commands/explain.ts`)
  - [x] `argMode: "input"`
  - [x] Treat `args` (trimmed) as the node; validate non-empty
  - [x] Call `coordinator.explain({ cwd: ctx.cwd, node: args })`
- [x] `/graphify-affected` (`src/commands/affected.ts`)
  - [x] `argMode: "input"`
  - [x] Split `args` with `splitArgs`; require at least one file
  - [x] Validate each path resolves within `ctx.cwd`
  - [x] Call `coordinator.affected({ cwd: ctx.cwd, files })`

### 4. Register individual slash commands

- [x] Create `src/commands/index.ts`
  - [x] Export `registerGraphifyCommands(pi, getCoordinator)`
  - [x] Iterate over `graphifyCommands` and call `pi.registerCommand(def.name, { description: def.description, handler: (args, ctx) => def.execute(ctx, getCoordinator, args) })`
- [x] Update `extensions/index.ts`
  - [x] Remove the inline `/graphify-status` registration
  - [x] Import and call `registerGraphifyCommands` and `registerGraphifyMenuCommand` at extension load time
  - [x] Keep `getCoordinator` closure shared with tools

### 5. Implement `/graphify` unified menu

- [x] Create `src/commands/menu.ts`
  - [x] Export `registerGraphifyMenuCommand(pi, getCoordinator)`
  - [x] Register `/graphify` with description "Open the Graphify command menu"
  - [x] Implement `showGraphifyMenu(ctx, getCoordinator)`
    - [x] Filter commands by `coordinator.supports(feature)`
    - [x] If `ctx.mode === "tui"`: render an overlay `SelectList` menu using `ctx.ui.custom(..., { overlay: true })`
    - [x] If `ctx.mode === "rpc"` and `ctx.hasUI`: use `ctx.ui.select` native selector
    - [x] If no UI: return silently (commands are UI-oriented)
  - [x] On menu selection:
    - [x] If `argMode === "none"`: execute directly
    - [x] If `argMode === "input"` or `"flags"`: prompt with `ctx.ui.input(def.prompt, def.placeholder)`, then execute with the provided args
  - [x] Handle cancellation (Esc / null) by closing without action
  - [x] Use `DynamicBorder`, `Container`, `Text`, and `SelectList` with theme-aware styling
  - [x] Export `buildMenuItems(commands)` for testing

### 6. Capability and state checks in handlers

- [x] Every executor checks `getCoordinator()` before doing anything; if null, notify a warning and return
- [x] Every executor checks `coordinator.supports(feature)`; if unsupported, notify a warning with the specific missing capability and return
- [x] Every executor checks `ctx.hasUI` before calling `ctx.ui.notify`; if false, return silently
- [x] Build-related executors respect `ctx.isProjectTrusted()`; warn and return if untrusted

### 7. Error handling

- [x] Catch `GraphifyError` in executors and route through `formatErrorForCommand`
- [x] Use severity `"warning"` for expected/user-fixable errors
- [x] Use severity `"error"` for unexpected failures
- [x] Do not throw from command handlers or executors
- [x] Handle uninitialized coordinator consistently

### 8. Testing

- [x] Create `src/commands/commands.test.ts`
  - [x] Test the registry contains all expected commands
  - [x] Test each executor with a mock coordinator and mock context
  - [x] Verify invalid arguments show usage hints
  - [x] Verify unknown flags on `/graphify-build` show usage hints
  - [x] Verify quoted arguments are parsed correctly
  - [x] Verify path traversal is rejected for `/graphify-affected`
  - [x] Verify unsupported capability produces a warning notification
  - [x] Verify uninitialized coordinator produces a warning notification
  - [x] Verify `GraphifyError` is handled gracefully
  - [x] Verify long output is truncated
- [x] Create `src/commands/menu.test.ts`
  - [x] Test `registerGraphifyMenuCommand` registers `/graphify`
  - [x] Test `buildMenuItems` filters out unsupported commands
  - [x] Test TUI mode opens an overlay menu with the correct items
  - [x] Test RPC mode falls back to `ctx.ui.select`
  - [x] Test non-UI mode does not crash
  - [x] Test selecting a no-arg command executes it immediately
  - [x] Test selecting an arg command opens `ctx.ui.input` and then executes with the result
  - [x] Test cancellation closes the menu

### 9. Verification

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] All commands are registered in `extensions/index.ts`
- [x] `/graphify` menu works in TUI mode
- [x] `/graphify` menu falls back gracefully in non-TUI modes
- [x] Individual commands can still be invoked directly
- [x] Commands route through `GraphifyCoordinator`
- [x] Commands produce clear, actionable UI output
- [x] Invalid arguments are handled with usage hints
- [x] Extension type-checks and lints cleanly

## Completion criteria

- [x] Every core tool has a corresponding slash command
- [x] Commands reuse the same coordinator methods as tools
- [x] Commands produce clear, actionable output in the UI
- [x] Invalid arguments are handled with usage hints
- [x] Unsupported capabilities are handled gracefully
- [x] Long output is truncated to avoid UI noise
- [x] A unified `/graphify` menu is available in TUI mode
- [x] The menu falls back gracefully in RPC and non-UI modes
- [x] New commands can be added by adding one entry to the registry
- [x] Extension type-checks and lints cleanly

## Decisions

### 1. Commands are thin wrappers around the coordinator

**Decision:** Each command executor calls the same `GraphifyCoordinator` method as the corresponding tool. No command talks directly to the CLI or backend.

**Why:** This keeps tools and commands behaviorally identical and avoids duplicating validation, capability checks, and error handling. The coordinator already normalizes backend results and errors.

**Alternatives considered:**
- Commands calling `pi.runTool` internally. Rejected because it introduces unnecessary indirection and would require the tool to be registered.
- Commands reimplementing backend logic. Rejected because it duplicates code and risks divergence.

### 2. Commands are registered synchronously at extension load time

**Decision:** `pi.registerCommand` is called during the extension factory execution, not inside `session_start`.

**Why:** Pi expects slash commands to be available immediately when the extension loads. The command handler captures the `getCoordinator` closure, so it always sees the coordinator initialized by the latest `session_start`.

**Alternatives considered:**
- Registering commands inside `session_start`. Rejected because commands may not appear until a session starts, which is inconsistent with Pi's command surface.

### 3. Capability checks happen in command executors

**Decision:** Commands are registered without checking capabilities, but each executor verifies `coordinator.supports(feature)` before running. If unsupported, the executor shows a clear warning.

**Why:** Capabilities are not known until the coordinator initializes in `session_start`. Registering at load time and checking at runtime gives users clear feedback instead of hiding commands or failing later.

**Alternatives considered:**
- Registering commands only when capabilities are detected. Rejected because it would require registering commands inside `session_start`, which can fire multiple times and is not the expected Pi command lifecycle.
- Showing commands but failing with a generic error. Rejected because users deserve a specific explanation (e.g., "The installed Graphify version does not support 'query'").

### 4. Command registry is the single source of truth

**Decision:** All command metadata and executors live in a `CommandDefinition` registry (`src/commands/registry.ts`). `src/commands/index.ts` registers slash commands from the registry, and `src/commands/menu.ts` builds the menu from the same registry.

**Why:** Adding a new command requires updating only one registry entry. Both the individual slash command and the `/graphify` menu update automatically, reducing duplication and drift.

**Alternatives considered:**
- Keeping slash commands and menu items separate. Rejected because every new command would need changes in two places, increasing the chance of inconsistency.

### 5. `/graphify` menu is a first-class TUI overlay with RPC fallback

**Decision:** In TUI mode, `/graphify` opens a native `SelectList` overlay with `DynamicBorder` framing and theme-aware styling. In RPC mode, it falls back to `ctx.ui.select`. In non-UI modes, it returns silently.

**Why:** `ctx.ui.custom` components are TUI-only. Using the official Pi `SelectList` and `DynamicBorder` ensures the menu looks native. The RPC fallback keeps the command usable in headless/RPC sessions without trying to render TUI components.

**Alternatives considered:**
- A single `ctx.ui.select` for all modes. Rejected because the user explicitly asked for an overlay menu and TUI users should get the richer overlay experience.
- A widget-based menu. Rejected because it would persist on screen and compete with the chat UI; an overlay is more appropriate for a transient command launcher.

### 6. Menu argument collection uses `ctx.ui.input`

**Decision:** For commands that need arguments, the menu opens a `ctx.ui.input` prompt with a contextual title and placeholder, then executes the command with the user-provided text.

**Why:** This keeps the menu self-contained. Users do not need to remember command syntax or return to the editor. It also handles complex inputs like multi-word queries naturally.

**Alternatives considered:**
- Setting editor text to the command prefix and letting the user finish typing. Rejected because it breaks the flow of the overlay menu and feels less polished.
- Inline editing inside the overlay. Rejected because `SelectList` does not support inline editing and building a custom input component would be overkill for this phase.

### 7. Output is truncated and errors are severity-typed

**Decision:** Command output is truncated to a fixed maximum length (e.g., 1000 characters). Formatters are pure functions that return strings and severity levels; executors call `ctx.ui.notify`.

**Why:** Pi notifications are not a log stream; overly long output degrades the UI. Pure formatters are easy to test and avoid hidden side effects.

**Alternatives considered:**
- Passing raw `stdout` directly to `notify`. Rejected because large Graphify outputs could overwhelm the UI.
- Formatters calling `ctx.ui.notify` directly. Rejected because it couples formatting to UI side effects and makes unit testing harder.

### 8. Path validation for `/graphify-affected`

**Decision:** File arguments for `/graphify-affected` are resolved relative to `ctx.cwd` and rejected if they traverse above the project root.

**Why:** This prevents accidental or malicious path traversal and follows the project security standards.

**Alternatives considered:**
- Passing paths directly to the backend. Rejected because the backend should not receive unvalidated user input.

### 9. No `console.log` in command executors

**Decision:** Commands use `ctx.ui.notify` when `ctx.hasUI` is true. If the run mode has no UI, the executor returns silently.

**Why:** `console.log` bypasses Pi's UI and can corrupt the TUI or JSON-RPC output. Commands are user-initiated UI actions; non-UI modes do not need command output.

**Alternatives considered:**
- Falling back to `console.log` when `hasUI` is false. Rejected per project standards.

## Dependencies

- **Phase 3 — Core tools** must be complete. Commands are thin wrappers around the same coordinator operations.

## Risks

- Commands may accidentally duplicate tool logic if not carefully implemented.
- Argument parsing for free-form queries and quoted file paths may be tricky.
- UI output may be too verbose if truncation is not applied consistently.
- Capability checks may be missed in some executors, leading to confusing backend errors.
- The TUI overlay menu adds complexity and is harder to test than plain slash commands.
- The command registry abstraction must be kept simple to avoid over-engineering.

## Testing notes

- Test command argument parsing independently, including quoted strings and unknown flags.
- Verify each executor delegates to the same coordinator method as the corresponding tool.
- Verify the registry correctly drives both slash-command registration and menu construction.
- Verify path traversal is rejected for `/graphify-affected`.
- Verify long output is truncated.
- Test the menu in TUI mode by mocking `ctx.ui.custom` and in RPC mode by mocking `ctx.ui.select`.
- Test non-UI mode ensures no crash and no `console.log`.

## Notes

Commands should be thin wrappers around the coordinator. Avoid duplicating logic between tools and commands.

The existing `/graphify-status` stub in `extensions/index.ts` should be removed and replaced by the registration helpers in `src/commands/index.ts` and `src/commands/menu.ts` so all commands live in one place.

Move `CoordinatorProvider` from `src/tools/index.ts` to `src/coordinator.ts` so both tools and commands import it from the same source. This keeps the shared dependency visible and avoids a hidden coupling.

See [`phase-04-menu-design.md`](phase-04-menu-design.md) for the detailed menu item registry and fallback mechanics.
