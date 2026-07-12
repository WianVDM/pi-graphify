/**
 * /graphify-status — show graph status for the current project.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatErrorForCommand } from "./format.js";
import { requireCoordinator } from "./helpers.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "status";

const executeStatus: CommandExecutor = async (ctx, getCoordinator) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinator(ctx, getCoordinator);
  if (!coordinator) return;

  try {
    const status = await coordinator.status({ cwd: ctx.cwd });
    if (status.hasGraph && status.graphPath) {
      ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
      return;
    }
    ctx.ui.notify("No Graphify graph found. Build one with `graphify .`.", "warning");
  } catch (error) {
    const { message, severity } = formatErrorForCommand(error);
    ctx.ui.notify(message, severity);
  }
};

export const statusCommand: CommandDefinition = {
  name: "graphify-status",
  label: "Graph status",
  description: "Show whether a Graphify knowledge graph exists for this project",
  feature: FEATURE,
  usage: "",
  argMode: "none",
  execute: executeStatus,
};
