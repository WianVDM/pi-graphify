/**
 * /graphify-explain — explain a node or concept in the graph.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatErrorForCommand, formatResultForCommand } from "./format.js";
import { requireCoordinatorWithCapability } from "./helpers.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "explain";

const executeExplain: CommandExecutor = async (ctx, getCoordinator, args) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support graph explanations.",
  );
  if (!coordinator) return;

  const node = args.trim();
  if (node === "") {
    ctx.ui.notify("Usage: /graphify-explain <node>", "warning");
    return;
  }

  try {
    const result = await coordinator.explain({ cwd: ctx.cwd, node });
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    const { message, severity } = formatErrorForCommand(error);
    ctx.ui.notify(message, severity);
  }
};

export const explainCommand: CommandDefinition = {
  name: "graphify-explain",
  label: "Explain node",
  description: "Explain a node or concept in the graph",
  menuDescription: "Explain a node or concept",
  feature: FEATURE,
  usage: "<node>",
  argMode: "input",
  prompt: "Enter a node name (e.g. auth)",
  placeholder: "src/coordinator.ts:GraphifyCoordinator",
  execute: executeExplain,
};
