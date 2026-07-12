/**
 * /graphify-build — build or update the Graphify knowledge graph.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatResultForCommand } from "./format.js";
import { notifyCommandError, requireCoordinatorWithCapability } from "./helpers.js";
import { parseBooleanFlag, splitArgs, usageError } from "./parse.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "build";
const BUILD_USAGE = "[--code-only] [--update] [--directed]";

const executeBuild: CommandExecutor = async (ctx, getCoordinator, args) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support graph builds.",
  );
  if (!coordinator) return;

  if (!ctx.isProjectTrusted()) {
    ctx.ui.notify("Project trust is required to build the Graphify graph.", "warning");
    return;
  }

  try {
    const { codeOnly, update, directed } = parseBuildArgs(args);
    const result = await coordinator.build({
      cwd: ctx.cwd,
      codeOnly,
      update,
      directed,
    });
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    notifyCommandError(ctx, error);
  }
};

export const buildCommand: CommandDefinition = {
  name: "graphify-build",
  label: "Build graph",
  description: "Build or incrementally update the Graphify knowledge graph",
  feature: FEATURE,
  usage: BUILD_USAGE,
  argMode: "flags",
  prompt: "Build graph (optional flags)",
  placeholder: "--code-only --update --directed",
  execute: executeBuild,
};

interface ParsedBuildArgs {
  codeOnly: boolean | undefined;
  update: boolean | undefined;
  directed: boolean | undefined;
}

function parseBuildArgs(args: string): ParsedBuildArgs {
  const tokens = splitArgs(args);
  let result = parseBooleanFlag(tokens, "code-only", true);
  const codeOnly = result.value;
  result = parseBooleanFlag(result.rest, "update", true);
  const update = result.value;
  result = parseBooleanFlag(result.rest, "directed", true);
  const directed = result.value;

  const unknown = result.rest.find((t) => t.startsWith("--"));
  if (unknown || result.rest.length > 0) {
    throw usageError("graphify-build", BUILD_USAGE);
  }

  return { codeOnly, update, directed };
}
