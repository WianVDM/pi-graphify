/**
 * Normalized error handling for pi-graphify.
 */

export type GraphifyErrorCode =
  | "MISSING"
  | "VERSION"
  | "BUILD"
  | "QUERY"
  | "PATH"
  | "EXPLAIN"
  | "AFFECTED"
  | "ADD"
  | "WATCH"
  | "REFLECT"
  | "TIMEOUT"
  | "MCP"
  | "UNKNOWN";

export class GraphifyError extends Error {
  readonly code: GraphifyErrorCode;
  readonly details: Record<string, unknown>;
  readonly userMessage: string;

  constructor(code: GraphifyErrorCode, userMessage: string, details: Record<string, unknown> = {}) {
    super(userMessage);
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    this.name = "GraphifyError";
  }
}

/** Map a Graphify operation name to an error code. */
export function codeForOperation(operation: string): GraphifyErrorCode {
  switch (operation) {
    case "build":
      return "BUILD";
    case "query":
      return "QUERY";
    case "path":
      return "PATH";
    case "explain":
      return "EXPLAIN";
    case "affected":
      return "AFFECTED";
    case "add":
      return "ADD";
    case "watch":
      return "WATCH";
    case "reflect":
      return "REFLECT";
    case "mcp":
      return "MCP";
    default:
      return "UNKNOWN";
  }
}

/** Build a user-friendly message from a backend result. */
export function messageForCliFailure(operation: string, exitCode: number, stderr: string): string {
  const trimmed = stderr.trim();
  if (trimmed) {
    return `graphify ${operation} failed (exit ${exitCode}): ${trimmed}`;
  }
  return `graphify ${operation} failed with exit code ${exitCode}`;
}
