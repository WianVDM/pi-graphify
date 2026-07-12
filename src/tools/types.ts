import type { GraphifyResult } from "../backends/types.js";

export interface ToolContext {
  cwd: string;
}

export interface TextContentItem {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: TextContentItem[];
  details: Record<string, unknown>;
}

export function successResult(result: GraphifyResult): ToolResult {
  return {
    content: [{ type: "text", text: result.stdout || "Operation completed successfully." }],
    details: {
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      backend: result.backend,
      feature: result.feature,
    },
  };
}

export function errorResult(text: string, details: Record<string, unknown> = {}): ToolResult {
  return { content: [{ type: "text", text: `Error: ${text}` }], details };
}
