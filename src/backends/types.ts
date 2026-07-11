/**
 * Backend abstraction types for pi-graphify.
 *
 * All Graphify operations go through the `GraphifyBackend` interface so the
 * rest of the extension is agnostic to whether the CLI or MCP is used.
 */

export interface GraphifyCapabilities {
  /** Core graph build. */
  build: boolean;
  /** Query the graph. */
  query: boolean;
  /** Shortest path between nodes. */
  path: boolean;
  /** Explain a node or relationship. */
  explain: boolean;
  /** Affected nodes/files. */
  affected: boolean;
  /** Add content to the graph. */
  add: boolean;
  /** Watch source files for changes. */
  watch: boolean;
  /** Reflect on graph structure. */
  reflect: boolean;
  /** MCP server support. */
  mcp: boolean;
  /** Graph status check. */
  status: boolean;
  /** Version reporting. */
  version: boolean;
  /** Directed graph support. */
  directedGraph: boolean;
  /** Incremental code-only updates. */
  incrementalUpdate: boolean;
  /** Semantic extraction beyond code. */
  semanticExtraction: boolean;
}

/** Normalized result from any Graphify backend. */
export interface GraphifyResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  backend: "cli" | "mcp";
  feature: string;
}

/** Backend-agnostic interface for all Graphify operations. */
export interface GraphifyBackend {
  readonly type: "cli" | "mcp";
  readonly version: string | null;
  readonly capabilities: GraphifyCapabilities;

  /**
   * Run a Graphify operation.
   *
   * @param operation - The operation name, e.g. `"build"`, `"query"`, `"status"`.
   * @param options - Operation-specific options.
   */
  run(operation: string, options: unknown): Promise<GraphifyResult>;

  /** Optional cleanup hook called on session shutdown. */
  close?(): Promise<void>;
}

/** Options for the `status` operation. */
export interface StatusOptions {
  cwd: string;
}

/** Options for the `version` operation. */
export interface VersionOptions {
  cwd?: string;
}

/** Options for the `build` operation. */
export interface BuildOptions {
  cwd: string;
  codeOnly?: boolean;
  update?: boolean;
  directed?: boolean;
}

/** Options for the `query` operation. */
export interface QueryOptions {
  cwd: string;
  question: string;
}

/** Options for the `path` operation. */
export interface PathOptions {
  cwd: string;
  source: string;
  target: string;
}

/** Options for the `explain` operation. */
export interface ExplainOptions {
  cwd: string;
  node: string;
}

/** Options for the `affected` operation. */
export interface AffectedOptions {
  cwd: string;
  files: string[];
}

/** Options for the `add` operation. */
export interface AddOptions {
  cwd: string;
  paths: string[];
}

/** Options for the `watch` operation. */
export interface WatchOptions {
  cwd: string;
  codeOnly?: boolean;
}

/** Options for the `reflect` operation. */
export interface ReflectOptions {
  cwd: string;
  question?: string;
}

/** All operation option types unioned together. */
export type GraphifyOperationOptions =
  | StatusOptions
  | VersionOptions
  | BuildOptions
  | QueryOptions
  | PathOptions
  | ExplainOptions
  | AffectedOptions
  | AddOptions
  | WatchOptions
  | ReflectOptions;

export function allCapabilitiesDisabled(): GraphifyCapabilities {
  return {
    build: false,
    query: false,
    path: false,
    explain: false,
    affected: false,
    add: false,
    watch: false,
    reflect: false,
    mcp: false,
    status: false,
    version: false,
    directedGraph: false,
    incrementalUpdate: false,
    semanticExtraction: false,
  };
}
