/**
 * Register all individual Graphify slash commands from the command registry.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { CoordinatorProvider } from "../coordinator.js";
import { graphifyCommands } from "./registry.js";
import { toCommandContext } from "./types.js";

export function registerGraphifyCommands(
  pi: ExtensionAPI,
  getCoordinator: CoordinatorProvider,
): void {
  for (const command of graphifyCommands) {
    pi.registerCommand(command.name, {
      description: command.description,
      handler: async (args, ctx) => {
        await command.execute(toCommandContext(ctx), getCoordinator, args);
      },
    });
  }
}
