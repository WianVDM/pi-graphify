import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { GraphifyError } from "../errors.js";
import { formatGraphifyError, formatGraphifyResult } from "./format.js";
import type { CoordinatorProvider } from "./index.js";

export function registerBuildTool(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  pi.registerTool({
    name: "graphify_build",
    label: "Graphify Build",
    description:
      "Build or incrementally update the Graphify knowledge graph for the current project.",
    promptSnippet: "Build or update the project's Graphify knowledge graph",
    promptGuidelines: [
      "Use graphify_build when the user wants to create or update the knowledge graph.",
      "Use graphify_build when graphify_status reports that no graph exists.",
    ],
    parameters: Type.Object({
      cwd: Type.String({ description: "Working directory of the project to build the graph for." }),
      codeOnly: Type.Optional(
        Type.Boolean({ description: "Only index code files; skip semantic extraction." }),
      ),
      update: Type.Optional(
        Type.Boolean({ description: "Perform an incremental update instead of a full rebuild." }),
      ),
      directed: Type.Optional(
        Type.Boolean({ description: "Build a directed graph instead of an undirected one." }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const coordinator = getCoordinator();
      if (!coordinator) {
        return formatGraphifyError(new GraphifyError("MISSING", "Graphify is not initialized."));
      }
      try {
        const result = await coordinator.build({ ...params, cwd: ctx.cwd });
        return formatGraphifyResult(result);
      } catch (error) {
        return formatGraphifyError(error);
      }
    },
  });
}
