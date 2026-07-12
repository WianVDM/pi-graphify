/**
 * Shared helpers for Graphify command executors.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import type { GraphifyCoordinator } from "../coordinator.js";
import { formatErrorForCommand } from "./format.js";
import type { CommandContext } from "./types.js";

/**
 * Return a coordinator if it is initialized and supports the required feature.
 * Otherwise notify the user and return null.
 */
export function requireCoordinatorWithCapability(
  ctx: CommandContext,
  getCoordinator: () => GraphifyCoordinator | null,
  feature: keyof GraphifyCapabilities,
  unsupportedMessage: string,
): GraphifyCoordinator | null {
  const coordinator = getCoordinator();
  if (!coordinator) {
    ctx.ui.notify("Graphify is not initialized.", "warning");
    return null;
  }

  if (!coordinator.supports(feature)) {
    ctx.ui.notify(unsupportedMessage, "warning");
    return null;
  }

  return coordinator;
}

/**
 * Return a coordinator if it is initialized, regardless of capability.
 */
export function requireCoordinator(
  ctx: CommandContext,
  getCoordinator: () => GraphifyCoordinator | null,
): GraphifyCoordinator | null {
  const coordinator = getCoordinator();
  if (!coordinator) {
    ctx.ui.notify("Graphify is not initialized.", "warning");
  }
  return coordinator;
}

/**
 * Notify the user of a command result, handling usage errors distinctly from
 * backend or unexpected errors.
 */
export function notifyCommandError(ctx: CommandContext, error: unknown): void {
  if (error instanceof Error && error.message.startsWith("Usage:")) {
    ctx.ui.notify(error.message, "warning");
    return;
  }

  const { message, severity } = formatErrorForCommand(error);
  ctx.ui.notify(message, severity);
}
