/**
 * GraphifyCoordinator — the single entry point for all Graphify operations.
 *
 * The coordinator loads configuration, selects a backend, detects the installed
 * Graphify version, builds a capability matrix, and routes tool/command
 * requests to the backend. It also normalizes backend results and errors.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createCliBackend } from "./backends/cli.js";
import {
  type AddOptions,
  type AffectedOptions,
  allCapabilitiesDisabled,
  type BuildOptions,
  type ExplainOptions,
  type GraphifyBackend,
  type GraphifyCapabilities,
  type GraphifyResult,
  type PathOptions,
  type QueryOptions,
  type ReflectOptions,
  type StatusOptions,
  type VersionOptions,
  type WatchOptions,
} from "./backends/types.js";
import { type GraphifyConfig, loadConfig } from "./config.js";
import { codeForOperation, GraphifyError, messageForCliFailure } from "./errors.js";

export interface GraphifyStatusResult {
  hasGraph: boolean;
  graphPath?: string;
  backendVersion: string | null;
}

export interface CoordinatorOptions {
  cwd: string;
  config?: GraphifyConfig;
}

export class GraphifyCoordinator {
  readonly config: GraphifyConfig;
  readonly cwd: string;
  private backend: GraphifyBackend | null = null;
  private readonly _warnings: string[] = [];
  private closed = false;

  constructor(options: CoordinatorOptions) {
    this.cwd = options.cwd;
    this.config = options.config ?? loadConfig();
  }

  async initialize(): Promise<void> {
    if (this.closed) {
      throw new GraphifyError("UNKNOWN", "Coordinator has already been closed");
    }

    try {
      // Phase 2 only supports CLI backend. MCP is a Phase 6 addition.
      this.backend = await createCliBackend({
        cwd: this.cwd,
        timeoutMs: this.config.queryTimeoutMs,
      });
    } catch (error) {
      this.backend = null;
      this._warnings.push(
        error instanceof Error ? error.message : "Graphify backend failed to initialize",
      );
    }
  }

  get version(): string | null {
    return this.backend?.version ?? null;
  }

  get capabilities(): GraphifyCapabilities {
    return this.backend?.capabilities ?? allCapabilitiesDisabled();
  }

  get warnings(): readonly string[] {
    return this._warnings;
  }

  supports(feature: keyof GraphifyCapabilities): boolean {
    return this.capabilities[feature] ?? false;
  }

  async status(_options: StatusOptions): Promise<GraphifyStatusResult> {
    const graphPath = join(this.cwd, "graphify-out", "graph.json");
    return {
      hasGraph: existsSync(graphPath),
      graphPath,
      backendVersion: this.version,
    };
  }

  async getVersion(_options?: VersionOptions): Promise<GraphifyResult> {
    if (!this.backend) {
      throw new GraphifyError("MISSING", "Graphify is not installed or not available on PATH.");
    }
    return {
      stdout: this.version ?? "unknown",
      stderr: "",
      exitCode: 0,
      durationMs: 0,
      backend: "cli",
      feature: "version",
    };
  }

  async build(options: BuildOptions): Promise<GraphifyResult> {
    return this.runWithFeature("build", options);
  }

  async query(options: QueryOptions): Promise<GraphifyResult> {
    return this.runWithFeature("query", options);
  }

  async path(options: PathOptions): Promise<GraphifyResult> {
    return this.runWithFeature("path", options);
  }

  async explain(options: ExplainOptions): Promise<GraphifyResult> {
    return this.runWithFeature("explain", options);
  }

  async affected(options: AffectedOptions): Promise<GraphifyResult> {
    return this.runWithFeature("affected", options);
  }

  async add(options: AddOptions): Promise<GraphifyResult> {
    return this.runWithFeature("add", options);
  }

  async watch(options: WatchOptions): Promise<GraphifyResult> {
    return this.runWithFeature("watch", options);
  }

  async reflect(options: ReflectOptions): Promise<GraphifyResult> {
    return this.runWithFeature("reflect", options);
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.backend?.close) {
      await this.backend.close();
    }
    this.backend = null;
  }

  private async runWithFeature(
    operation: keyof GraphifyCapabilities,
    options: unknown,
  ): Promise<GraphifyResult> {
    if (!this.backend) {
      throw new GraphifyError("MISSING", `Graphify is not available. Cannot run ${operation}.`);
    }

    if (!this.supports(operation)) {
      throw new GraphifyError(
        "VERSION",
        `The installed Graphify version does not support "${operation}".`,
      );
    }

    const result = await this.backend.run(operation, options);
    if (result.exitCode !== 0) {
      throw new GraphifyError(
        codeForOperation(operation),
        messageForCliFailure(operation, result.exitCode, result.stderr),
        { exitCode: result.exitCode, stderr: result.stderr },
      );
    }
    return result;
  }
}

/** Convenience factory. */
export async function createGraphifyCoordinator(
  cwd: string,
  config?: GraphifyConfig,
): Promise<GraphifyCoordinator> {
  const coordinator = new GraphifyCoordinator({ cwd, config });
  await coordinator.initialize();
  return coordinator;
}
