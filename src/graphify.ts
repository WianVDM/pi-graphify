/**
 * Graphify CLI helpers
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GraphifyConfig } from "./config.js";

export interface GraphifyResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface GraphStatus {
  hasGraph: boolean;
  graphPath?: string;
  error?: string;
}

/** Best-effort resolve of the graphify CLI executable name. */
export async function findGraphifyCli(): Promise<string> {
  // Pi shells run with the user's PATH, so the bare command is usually enough.
  // We try a platform-aware check first; if it fails, we fall back to "graphify".
  const checkCmd = process.platform === "win32" ? "where" : "which";
  const shell = process.platform === "win32" ? "cmd.exe" : undefined;

  return new Promise((resolve) => {
    execFile(checkCmd, ["graphify"], { shell }, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve("graphify");
        return;
      }
      // Use the first match returned by where/which.
      resolve(stdout.split("\n")[0].trim());
    });
  });
}

/** Run a graphify CLI command with a timeout. */
export async function runGraphify(
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<GraphifyResult> {
  const cli = await findGraphifyCli();

  return new Promise((resolve) => {
    execFile(cli, args, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim() || error.message,
          exitCode: typeof error.code === "number" ? error.code : 1,
        });
        return;
      }
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      });
    });
  });
}

/** Check whether a graph exists for the given project directory. */
export async function graphifyStatus(cwd: string): Promise<GraphStatus> {
  const graphPath = join(cwd, "graphify-out", "graph.json");

  if (!existsSync(graphPath)) {
    return { hasGraph: false };
  }

  return { hasGraph: true, graphPath };
}

/** Build a short system-prompt hint that the graph is available. */
export function buildGraphifyHint(graphPath: string): string {
  return [
    "<graphify-context>",
    `A Graphify knowledge graph is available at ${graphPath}.`,
    "When answering questions about this codebase, prefer querying the graph via the graphify_status, graphify_query, graphify_path, and graphify_explain tools instead of grepping or reading raw files.",
    "Only fall back to raw file reads when the graph lacks the needed detail or when modifying/debugging specific lines.",
    "</graphify-context>",
  ].join("\n");
}

/** Format a graphify CLI result for display. */
export function formatResult(result: GraphifyResult): string {
  if (result.exitCode === 0) {
    return result.stdout;
  }
  return `graphify exited with code ${result.exitCode}\n${result.stderr || result.stdout}`.trim();
}

export type { GraphifyConfig };
