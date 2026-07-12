/**
 * Shared result formatting helpers for graphify tools.
 */

import type { GraphifyResult } from "../backends/types.js";
import { GraphifyError } from "../errors.js";
import { errorResult, successResult, type ToolResult } from "./types.js";

/** Format a successful Graphify result into tool content. */
export function formatGraphifyResult(result: GraphifyResult): ToolResult {
  return successResult(result);
}

/** Format a Graphify or unexpected error into friendly tool content. */
export function formatGraphifyError(error: unknown): ToolResult {
  if (error instanceof GraphifyError) {
    return errorResult(error.userMessage, { code: error.code, details: error.details });
  }

  if (error instanceof Error) {
    return errorResult(error.message);
  }

  return errorResult(String(error));
}
