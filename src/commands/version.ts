/**
 * /graphify-version — show the installed Graphify CLI version.
 */

import type { GraphifyCapabilities } from "../backends/types.js";
import { formatErrorForCommand, formatResultForCommand } from "./format.js";
import { requireCoordinatorWithCapability } from "./helpers.js";
import type { CommandDefinition, CommandExecutor } from "./types.js";

const FEATURE: keyof GraphifyCapabilities = "version";

const executeVersion: CommandExecutor = async (ctx, getCoordinator) => {
  if (!ctx.hasUI) return;

  const coordinator = requireCoordinatorWithCapability(
    ctx,
    getCoordinator,
    FEATURE,
    "The installed Graphify version does not support version reporting.",
  );
  if (!coordinator) return;

  try {
    const result = await coordinator.getVersion();
    ctx.ui.notify(formatResultForCommand(result), "info");
  } catch (error) {
    const { message, severity } = formatErrorForCommand(error);
    ctx.ui.notify(message, severity);
  }
};

export const versionCommand: CommandDefinition = {
  name: "graphify-version",
  label: "Graphify version",
  description: "Show the installed Graphify CLI version",
  feature: FEATURE,
  usage: "",
  argMode: "none",
  execute: executeVersion,
};
