# Architecture Document: pi-graphify

This document describes the internal architecture of `pi-graphify`. It is intended for developers who want to understand or contribute to the extension.

---

## Component overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Pi Agent                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Extension Entry Point                     │
│                  (extensions/index.ts)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Tool         │  │ Command      │  │ Event handlers   │  │
│  │ registration │  │ registration │  │ (session, model) │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Coordinator                            │
│                  (src/coordinator.ts)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Backend      │  │ Version      │  │ State manager    │  │
│  │ selector     │  │ manager      │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│       CliBackend           │    │        McpBackend          │
│    (src/backends/cli.ts)   │    │   (src/backends/mcp.ts)    │
│  Shells out to `graphify`  │    │ Spawns `graphify --mcp`    │
│  via execFile              │    │ and speaks JSON-RPC        │
└────────────────────────────┘    └────────────────────────────┘
```

---

## Backend abstraction

All Graphify operations are abstracted behind a `GraphifyBackend` interface. This allows the rest of the extension to be backend-agnostic.

```typescript
export interface GraphifyBackend {
  readonly type: 'cli' | 'mcp';
  readonly version: string | null;
  readonly capabilities: GraphifyCapabilities;

  status(cwd: string): Promise<GraphStatusResult>;
  build(options: BuildOptions): Promise<GraphifyResult>;
  query(options: QueryOptions): Promise<GraphifyResult>;
  path(options: PathOptions): Promise<GraphifyResult>;
  explain(options: ExplainOptions): Promise<GraphifyResult>;
  affected(options: AffectedOptions): Promise<GraphifyResult>;
  add(options: AddOptions): Promise<GraphifyResult>;
  watch(options: WatchOptions): Promise<GraphifyResult>;
  reflect(options: ReflectOptions): Promise<GraphifyResult>;

  close?(): Promise<void>;
}
```

### Capabilities

```typescript
export interface GraphifyCapabilities {
  query: boolean;
  path: boolean;
  explain: boolean;
  affected: boolean;
  add: boolean;
  watch: boolean;
  reflect: boolean;
  mcp: boolean;
  directedGraph: boolean;
  incrementalUpdate: boolean;
  semanticExtraction: boolean;
}
```

Capabilities are determined by:
1. Detected Graphify version.
2. Whether the backend is CLI or MCP.
3. A feature map that maps version ranges to supported features.

### Backend selector

The coordinator chooses the backend in this order:

1. **MCP if explicitly enabled** (`backend: 'mcp'` in config) and available.
2. **MCP if auto-detected** (`backend: 'auto'`) and the MCP server starts successfully.
3. **CLI** as the universal fallback.

The CLI backend is always safe to attempt because Graphify is required to be installed. The MCP backend is preferred when it works because it provides typed, structured responses and avoids spawning a process per call.

---

## Backend implementations

### CliBackend

Responsibilities:
- Resolve the Graphify executable path.
- Execute `graphify <command>` with argument arrays via `execFile`.
- Parse stdout/stderr into a normalized `GraphifyResult`.
- Enforce timeouts.
- Handle version detection via `graphify --version`.

Security:
- Never construct shell strings.
- Validate all paths before passing them.
- Respect `timeout` to prevent hung processes.

### McpBackend

Responsibilities:
- Spawn `graphify --mcp` as a long-lived stdio process per session.
- Maintain a JSON-RPC client over stdin/stdout.
- Map Pi tool calls to MCP tool invocations.
- Cache the graph context so the MCP server does not reload the graph on every call.
- Close the process on `session_shutdown`.

Fallback:
- If the MCP process fails to start or crashes, the coordinator falls back to `CliBackend` and logs the reason.

---

## Coordinator

The coordinator is the single entry point for all Graphify operations. It:

1. Loads configuration.
2. Detects or selects the backend.
3. Checks the installed Graphify version against the supported range.
4. Builds a capability map.
5. Routes tool/command requests to the backend.
6. Normalizes backend results into a common format.
7. Handles errors and converts them into user-friendly messages.

```typescript
export class GraphifyCoordinator {
  constructor(config: GraphifyConfig, backend: GraphifyBackend);
  
  initialize(): Promise<void>;
  getStatus(): Promise<SystemStatus>;
  runOperation(name: string, options: unknown): Promise<GraphifyResult>;
  supports(feature: keyof GraphifyCapabilities): boolean;
  close(): Promise<void>;
}
```

---

## Version manager

The version manager is responsible for detecting the installed Graphify version and determining what features are available.

```typescript
export interface GraphifyVersionInfo {
  version: string | null;
  installationMethod: 'uv' | 'pipx' | 'pip' | 'system' | 'unknown';
  isSupported: boolean;
  isRecommended: boolean;
  minSupported: string;
  recommended: string;
  warnings: string[];
}
```

It is used by:
- The coordinator to disable unsupported features.
- The `graphify_version` tool to report compatibility.
- The `session_start` handler to notify the user of issues.

---

## State manager

The state manager holds per-session runtime state. It does not persist across sessions; it is rebuilt on `session_start`.

```typescript
export interface GraphifyState {
  cwd: string;
  graphPath: string | null;
  graphExists: boolean;
  graphMtime: number | null;
  backendType: 'cli' | 'mcp';
  graphifyVersion: string | null;
  capabilities: GraphifyCapabilities;
  watcherActive: boolean;
  lastError: string | null;
}
```

This state is used by:
- Event handlers to decide whether to inject hints.
- Tools to check prerequisites quickly.
- Commands to report status.

---

## Watcher manager

The watcher manager watches source files and triggers incremental rebuilds.

Responsibilities:
- Use `chokidar` to watch the project root.
- Ignore `node_modules/`, `.git/`, `graphify-out/`, and other non-source directories.
- Debounce change events.
- Run `graphify --update` with `codeOnly: true` by default.
- Never run full semantic rebuilds automatically.
- Stop cleanly on `session_shutdown`.

```typescript
export interface WatcherOptions {
  root: string;
  debounceMs: number;
  ignored: string[];
  codeOnly: boolean;
}
```

---

## Tool/command mapping

Each tool has a corresponding command, but the implementation is shared.

```typescript
// src/tools/query.ts
export function registerQueryTool(pi: ExtensionAPI, coordinator: GraphifyCoordinator) {
  pi.registerTool({
    name: 'graphify_query',
    // ...
    execute: async (_id, params, _signal, _onUpdate, ctx) => {
      return coordinator.runOperation('query', { ...params, cwd: ctx.cwd });
    },
  });
}

// src/commands/query.ts
export function registerQueryCommand(pi: ExtensionAPI, coordinator: GraphifyCoordinator) {
  pi.registerCommand('graphify-query', {
    handler: async (args, ctx) => {
      const result = await coordinator.runOperation('query', { question: args, cwd: ctx.cwd });
      ctx.ui.notify(result.stdout.slice(0, 200), 'info');
    },
  });
}
```

This ensures tools and commands behave identically and reduces duplication.

---

## Error normalization

All backends return a `GraphifyResult`:

```typescript
export interface GraphifyResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  backend: 'cli' | 'mcp';
  feature: string;
}
```

The coordinator converts backend errors into extension-level errors:

```typescript
export class GraphifyError extends Error {
  readonly code: 'MISSING' | 'VERSION' | 'BUILD' | 'QUERY' | 'TIMEOUT' | 'MCP' | 'UNKNOWN';
  readonly details: Record<string, unknown>;
  readonly userMessage: string;
}
```

This allows tools and UI to present consistent messages without knowing backend specifics.

---

## Configuration loading

Configuration is loaded in this order (later overrides earlier):

1. Default config (`src/config.ts`).
2. Global config (`~/.pi/agent/pi-graphify/config.json`).
3. Project-local config (`.pi/pi-graphify.json`) if project is trusted.

```typescript
export interface GraphifyConfig {
  backend: 'auto' | 'cli' | 'mcp';
  autoHint: boolean;
  autoWatch: boolean;
  watchDebounceMs: number;
  buildTimeoutMs: number;
  queryTimeoutMs: number;
  shortTimeoutMs: number;
  staleThresholdHours: number;
  codeOnlyUpdates: boolean;
  interceptReads: boolean;
  graphifyPath?: string;
  mcpTimeoutMs: number;
}
```

---

## Integration hooks

`pi-graphify` is designed so that third-party integrations are optional, easy to add, and easy to build. The core extension works without any integrations. When another extension is available, `pi-graphify` can detect it and wire itself in through well-defined hooks.

### Hook interface

```typescript
export interface GraphifyIntegration {
  readonly name: string;
  readonly priority: number;
  isAvailable(pi: ExtensionAPI): boolean | Promise<boolean>;
  onGraphBuilt?(result: GraphifyResult): void | Promise<void>;
  onQueryResult?(result: GraphifyResult, question: string): void | Promise<void>;
  onLesson?(lesson: GraphifyLesson): void | Promise<void>;
}

export interface GraphifyLesson {
  kind: 'insight' | 'correction' | 'dead_end' | 'preference';
  summary: string;
  sourceNodes: string[];
  query?: string;
}
```

### How integrations are registered

Third-party Pi extensions register themselves by importing a small registration helper from `pi-graphify`:

```typescript
import { registerGraphifyIntegration } from 'pi-graphify/integrations';

registerGraphifyIntegration({
  name: 'pi-hermes-memory',
  priority: 100,
  isAvailable: (pi) => pi.getAllTools().some((t) => t.name === 'memory'),
  onLesson: async (lesson) => {
    // Save a durable memory entry
  },
});
```

If no integrations are registered, the extension functions normally. This keeps the core lean and avoids hard dependencies.

### Built-in integration stubs

The extension ships with no built-in third-party integrations. It may include example adapters in a separate `examples/integrations/` directory to show how to build them.

### Future integration candidates

- `pi-hermes-memory`: save graph-derived lessons as memory entries.
- `pi-fallow`: cross-reference dead-code findings with graph communities.
- Custom provider extensions: route semantic extraction through the user’s configured provider.

These are explicitly out of scope for the initial implementation but are supported by the hook design.

---

## Module boundaries

- `extensions/` — Only Pi registration code. No business logic.
- `src/coordinator.ts` — The only place backend selection happens.
- `src/backends/` — Backend-specific code. No Pi imports.
- `src/tools/` — Tool definitions. Each tool calls the coordinator.
- `src/commands/` — Command definitions. Each command calls the coordinator.
- `src/config.ts` — Pure config loading. No Pi imports.
- `src/state.ts` — Session state.
- `src/watcher.ts` — File watcher.
- `src/version.ts` — Version detection and compatibility.

This separation makes the core logic testable without loading Pi.
