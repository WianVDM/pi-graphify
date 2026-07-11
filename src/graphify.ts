/**
 * High-level Graphify helpers used by the extension and tools.
 *
 * CLI execution has moved to `src/backends/cli.ts`. This module retains:
 *   - graph existence checks
 *   - system-prompt hint construction
 *   - result formatting utilities
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GraphifyResult } from "./backends/types.js";

export interface GraphStatus {
  hasGraph: boolean;
  graphPath?: string;
}

/** Check whether a graph exists for the given project directory. */
export function graphifyStatus(cwd: string): GraphStatus {
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
