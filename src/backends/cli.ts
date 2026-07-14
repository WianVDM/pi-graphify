/**
 * CLI backend for Graphify.
 *
 * Resolves the `graphify` executable, runs commands via `execFile`, and
 * normalizes the results into the backend-agnostic `GraphifyResult` shape.
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { buildCapabilities, detectVersion } from "../version.js";
import type { GraphifyBackend, GraphifyCapabilities, GraphifyResult } from "./types.js";
import { allCapabilitiesDisabled } from "./types.js";

const DEFAULT_TIMEOUT = 30_000;

export interface CliBackendOptions {
  cwd: string;
  timeoutMs?: number;
  /** Explicit executable path from config or env. */
  explicitPath?: string;
}

export class CliBackend implements GraphifyBackend {
  readonly type = "cli" as const;
  private readonly cwd: string;
  private readonly timeoutMs: number;
  private readonly explicitPath: string | undefined;
  private _cli: string | null = null;
  private _version: string | null = null;
  private _capabilities: GraphifyCapabilities | null = null;

  constructor(options: CliBackendOptions) {
    this.cwd = options.cwd;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
    this.explicitPath = options.explicitPath;
  }

  get version(): string | null {
    return this._version;
  }

  get capabilities(): GraphifyCapabilities {
    return this._capabilities ?? allCapabilitiesDisabled();
  }

  async initialize(): Promise<void> {
    this._cli = await this.resolveCli();
    const versionInfo = await detectVersion(this._cli, this.cwd);
    this._version = versionInfo.version;

    this._capabilities = await buildCapabilities(this._cli, this.cwd, versionInfo, async (args) =>
      this.runHelp(args),
    );
  }

  async run(operation: string, options: unknown): Promise<GraphifyResult> {
    const cli = await this.resolveCli();
    const args = buildArgs(operation, options);
    const start = performance.now();

    return new Promise((resolve) => {
      execFile(cli, args, { cwd: this.cwd, timeout: this.timeoutMs }, (error, stdout, stderr) => {
        const durationMs = Math.round(performance.now() - start);
        if (error) {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim() || error.message,
            exitCode: typeof error.code === "number" ? error.code : 1,
            durationMs,
            backend: "cli",
            feature: operation,
          });
          return;
        }
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: 0,
          durationMs,
          backend: "cli",
          feature: operation,
        });
      });
    });
  }

  async close(): Promise<void> {
    // CLI backend has no persistent process to clean up.
    this._cli = null;
  }

  private async resolveCli(): Promise<string> {
    if (this._cli) return this._cli;
    if (this.explicitPath) return this.explicitPath;

    // Try the PATH first.
    const fromPath = await findOnPath("graphify");
    if (fromPath) return fromPath;

    // Common install locations.
    const candidates = [
      join(homedir(), ".local", "bin", "graphify"),
      join(homedir(), ".cargo", "bin", "graphify"),
      join(homedir(), ".pipx", "venvs", "graphify", "bin", "graphify"),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }

    // Fall back to the bare command and let execFile report the error.
    return "graphify";
  }

  private async runHelp(args: string[]): Promise<{ stdout: string; exitCode: number }> {
    const cli = await this.resolveCli();
    return new Promise((resolve) => {
      execFile(cli, args, { cwd: this.cwd, timeout: 10_000 }, (error, stdout, _stderr) => {
        if (error) {
          resolve({
            stdout: stdout.trim(),
            exitCode: typeof error.code === "number" ? error.code : 1,
          });
          return;
        }
        resolve({ stdout: stdout.trim(), exitCode: 0 });
      });
    });
  }
}

/** Best-effort find an executable on the user PATH. */
function findOnPath(command: string): Promise<string | null> {
  const checkCmd = process.platform === "win32" ? "where" : "which";
  const shell = process.platform === "win32" ? "cmd.exe" : undefined;

  return new Promise((resolve) => {
    execFile(checkCmd, [command], { shell }, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null);
        return;
      }
      resolve(stdout.split("\n")[0].trim());
    });
  });
}

/** Build a CLI argument array from an operation and options. */
export function buildArgs(operation: string, options: unknown): string[] {
  if (!options || typeof options !== "object") {
    return operation === "build" ? ["."] : [operation];
  }

  const opts = options as Record<string, unknown>;

  switch (operation) {
    case "build": {
      const args = ["."];
      if (opts.codeOnly === true) args.push("--code-only");
      if (opts.update === true) args.push("--update");
      if (opts.directed === true) args.push("--directed");
      return args;
    }
    case "query": {
      const args = ["query"];
      if (opts.question && typeof opts.question === "string") {
        args.push(opts.question);
      }
      return args;
    }
    case "path": {
      const args = ["path"];
      if (opts.source && typeof opts.source === "string") {
        args.push(opts.source);
      }
      if (opts.target && typeof opts.target === "string") {
        args.push(opts.target);
      }
      return args;
    }
    case "explain": {
      const args = ["explain"];
      if (opts.node && typeof opts.node === "string") {
        args.push(opts.node);
      }
      return args;
    }
    case "affected": {
      const args = ["affected"];
      if (Array.isArray(opts.files)) {
        for (const file of opts.files) {
          if (typeof file === "string") args.push(file);
        }
      }
      return args;
    }
    default: {
      const args = [operation];
      if (opts.codeOnly === true) args.push("--code-only");
      if (opts.update === true) args.push("--update");
      if (opts.directed === true) args.push("--directed");
      if (opts.question && typeof opts.question === "string") {
        args.push(opts.question);
      }
      if (opts.source && typeof opts.source === "string") {
        args.push("--source", opts.source);
      }
      if (opts.target && typeof opts.target === "string") {
        args.push("--target", opts.target);
      }
      if (opts.node && typeof opts.node === "string") {
        args.push("--node", opts.node);
      }
      if (Array.isArray(opts.files)) {
        for (const file of opts.files) {
          if (typeof file === "string") args.push(file);
        }
      }
      if (Array.isArray(opts.paths)) {
        for (const p of opts.paths) {
          if (typeof p === "string") {
            args.push(resolve(p));
          }
        }
      }
      return args;
    }
  }
}

/** Create a CLI backend and initialize it. */
export async function createCliBackend(options: CliBackendOptions): Promise<CliBackend> {
  const backend = new CliBackend(options);
  await backend.initialize();
  return backend;
}
