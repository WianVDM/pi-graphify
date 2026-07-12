/**
 * Single source of truth for all Graphify slash commands.
 */

import type { GraphifyCoordinator } from "../coordinator.js";
import { affectedCommand } from "./affected.js";
import { buildCommand } from "./build.js";
import { explainCommand } from "./explain.js";
import { pathCommand } from "./path.js";
import { queryCommand } from "./query.js";
import { statusCommand } from "./status.js";
import type { CommandDefinition } from "./types.js";
import { versionCommand } from "./version.js";

export const graphifyCommands: CommandDefinition[] = [
  buildCommand,
  queryCommand,
  pathCommand,
  explainCommand,
  affectedCommand,
  statusCommand,
  versionCommand,
];

export function getAvailableCommands(
  coordinator: GraphifyCoordinator | null,
  commands: CommandDefinition[] = graphifyCommands,
): CommandDefinition[] {
  if (!coordinator) return [];
  return commands.filter((command) => coordinator.supports(command.feature));
}
