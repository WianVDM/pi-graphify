/**
 * Pure formatting helpers for command UI output.
 */

import type { GraphifyResult } from "../backends/types.js";
import { GraphifyError } from "../errors.js";

const MAX_NOTIFICATION_LENGTH = 1000;
const TRUNCATION_SUFFIX = "\n... (truncated)";

/** Convert a successful backend result to a UI string, truncating if needed. */
export function formatResultForCommand(result: GraphifyResult): string {
  const output = result.stdout.trim();
  return truncate(output);
}

export interface FormattedError {
  message: string;
  severity: "warning" | "error";
}

/** Normalize an error into a severity-typed command message. */
export function formatErrorForCommand(error: unknown): FormattedError {
  if (error instanceof GraphifyError) {
    return { message: error.userMessage, severity: "warning" };
  }

  if (error instanceof Error) {
    return { message: error.message, severity: "error" };
  }

  return { message: String(error), severity: "error" };
}

function truncate(text: string): string {
  if (text.length <= MAX_NOTIFICATION_LENGTH) {
    return text;
  }
  return text.slice(0, MAX_NOTIFICATION_LENGTH - TRUNCATION_SUFFIX.length) + TRUNCATION_SUFFIX;
}
