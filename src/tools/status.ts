/**
 * Graphify status tool
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { GraphifyConfig } from "../config.js";
import { graphifyStatus } from "../graphify.js";

export function registerStatusTool(pi: ExtensionAPI, _config: GraphifyConfig): void {
  pi.registerTool({
    name: "graphify_status",
    label: "Graphify Status",
    description:
      "Check whether a Graphify knowledge graph exists for the current project and whether the graphify CLI is available.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const status = await graphifyStatus(ctx.cwd);

      if (!status.hasGraph) {
        return {
          content: [
            {
              type: "text",
              text: "No Graphify graph found. Run /graphify-build to build one.",
            },
          ],
          details: {},
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Graphify graph is available at ${status.graphPath}.`,
          },
        ],
        details: {},
      };
    },
  });
}
