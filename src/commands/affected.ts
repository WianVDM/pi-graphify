/**
 * /graphify-affected — show files and nodes affected by changes to given files.
 */

import { resolve } from "node:path";
import type { GraphifyCapabilities } from "../backends/types.js";
import { formatResultForCommand } from "./format.js";
import { notifyCommandError, requireCoordinatorWithCapability } from "./helpers.js";
import { splitArgs, usageError } from "./parse.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "affected";
const AFFECTED_USAGE = "<file> [file...]";

const executeAffected: CommandExecutor = async (ctx, getCoordinator, args) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support affected analysis.",
  );
  if (!coordinator) return;

  try {
    const files = parseAffectedArgs(ctx.cwd, args);
    const result = await coordinator.affected({ cwd: ctx.cwd, files });
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    notifyCommandError(ctx, error);
  }
};

export const affectedCommand: CommandDefinition = {
  name: "graphify-affected",
  label: "Show affected",
  description: "Show files and nodes affected by changes to given files",
  feature: FEATURE,
  usage: AFFECTED_USAGE,
  argMode: "input",
  prompt: "Files to analyze",
  placeholder: "src/index.ts src/utils.ts",
  execute: executeAffected,
};

function parseAffectedArgs(cwd: string, args: string): string[] {
  const tokens = splitArgs(args);
  if (tokens.length === 0) {
    throw usageError("graphify-affected", AFFECTED_USAGE);
  }

  return tokens.map((file) => resolveFile(cwd, file));
}

function resolveFile(cwd: string, file: string): string {
  const absolute = resolve(cwd, file);
  const normalizedCwd = resolve(cwd);
  if (!absolute.startsWith(normalizedCwd)) {
    throw new Error(`Invalid file path: ${file} is outside the project directory.`);
  }
  return absolute;
}
