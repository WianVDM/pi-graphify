/**
 * Graphify status tool
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { CoordinatorProvider } from "./index.js";

export function registerStatusTool(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  pi.registerTool({
    name: "graphify_status",
    label: "Graphify Status",
    description: "Check whether a Graphify knowledge graph exists for the current project.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const coordinator = getCoordinator();
      if (!coordinator) {
        return {
          content: [
            {
              type: "text",
              text: "Graphify is not initialized yet.",
            },
          ],
          details: {},
        };
      }

      const status = await coordinator.status({ cwd: ctx.cwd });
      const details: Record<string, unknown> = {
        hasGraph: status.hasGraph,
        backendVersion: status.backendVersion,
      };

      if (!status.hasGraph) {
        const cliNote = status.backendVersion ? "" : " The Graphify CLI was not detected on PATH.";
        return {
          content: [
            {
              type: "text",
              text: `No Graphify graph found. Run /graphify-build to build one.${cliNote}`,
            },
          ],
          details,
        };
      }

      const graphText = status.backendVersion
        ? `Graphify graph is available at ${status.graphPath}.`
        : `Graphify graph is available at ${status.graphPath}, but the Graphify CLI was not detected on PATH.`;

      return {
        content: [
          {
            type: "text",
            text: graphText,
          },
        ],
        details: {
          ...details,
          graphPath: status.graphPath,
        },
      };
    },
  });
}
