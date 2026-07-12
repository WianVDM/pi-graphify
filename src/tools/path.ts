import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { GraphifyError } from "../errors.js";
import { formatGraphifyError, formatGraphifyResult } from "./format.js";
import type { CoordinatorProvider } from "./index.js";

export function registerPathTool(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  pi.registerTool({
    name: "graphify_path",
    label: "Graphify Path",
    description:
      "Trace the shortest path between two nodes (functions, files, tools, or concepts) in the Graphify knowledge graph.",
    promptSnippet:
      "Trace how two functions, files, tools, or concepts are connected in the knowledge graph",
    promptGuidelines: [
      "Use graphify_path when the user asks how two concepts, functions, files, tools, or symbols are related.",
      "Use graphify_path instead of manually tracing code when both source and target are known nodes in the graph.",
    ],
    parameters: Type.Object({
      cwd: Type.String({ description: "Working directory of the project to search." }),
      source: Type.String({
        minLength: 1,
        description: "The source node or concept to start from.",
      }),
      target: Type.String({
        minLength: 1,
        description: "The target node or concept to find a path to.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const coordinator = getCoordinator();
      if (!coordinator) {
        return formatGraphifyError(new GraphifyError("MISSING", "Graphify is not initialized."));
      }
      try {
        const result = await coordinator.path({ ...params, cwd: ctx.cwd });
        return formatGraphifyResult(result);
      } catch (error) {
        return formatGraphifyError(error);
      }
    },
  });
}
