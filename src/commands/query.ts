/**
 * /graphify-query — ask a natural-language question against the graph.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatErrorForCommand, formatResultForCommand } from "./format.js";
import { requireCoordinatorWithCapability } from "./helpers.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "query";

const executeQuery: CommandExecutor = async (ctx, getCoordinator, args) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support graph queries.",
  );
  if (!coordinator) return;

  const question = args.trim();
  if (question === "") {
    ctx.ui.notify("Usage: /graphify-query <question>", "warning");
    return;
  }

  try {
    const result = await coordinator.query({ cwd: ctx.cwd, question });
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    const { message, severity } = formatErrorForCommand(error);
    ctx.ui.notify(message, severity);
  }
};

export const queryCommand: CommandDefinition = {
  name: "graphify-query",
  label: "Query graph",
  description: "Ask a natural-language question against the graph",
  feature: FEATURE,
  usage: "<question>",
  argMode: "input",
  prompt: "Question",
  placeholder: "What does this project do?",
  execute: executeQuery,
};
