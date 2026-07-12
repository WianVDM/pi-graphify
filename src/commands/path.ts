/**
 * /graphify-path — find the shortest path between two nodes in the graph.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatResultForCommand } from "./format.js";
import { notifyCommandError, requireCoordinatorWithCapability } from "./helpers.js";
import { splitArgs, usageError } from "./parse.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "path";
const PATH_USAGE = "<source> <target>";

const executePath: CommandExecutor = async (ctx, getCoordinator, args) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support path queries.",
  );
  if (!coordinator) return;

  try {
    const [source, target] = parsePathArgs(args);
    const result = await coordinator.path({ cwd: ctx.cwd, source, target });
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    notifyCommandError(ctx, error);
  }
};

export const pathCommand: CommandDefinition = {
  name: "graphify-path",
  label: "Find path",
  description: "Find the shortest path between two nodes in the graph",
  feature: FEATURE,
  usage: PATH_USAGE,
  argMode: "input",
  prompt: "Path source and target",
  placeholder: "src/index.ts src/utils.ts",
  execute: executePath,
};

function parsePathArgs(args: string): [string, string] {
  const tokens = splitArgs(args);
  if (tokens.length !== 2) {
    throw usageError("graphify-path", PATH_USAGE);
  }
  return [tokens[0], tokens[1]];
}
