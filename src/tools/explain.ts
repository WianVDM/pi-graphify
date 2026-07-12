import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { GraphifyError } from "../errors.js";
import { formatGraphifyError, formatGraphifyResult } from "./format.js";
import type { CoordinatorProvider } from "./index.js";

export function registerExplainTool(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  pi.registerTool({
    name: "graphify_explain",
    label: "Graphify Explain",
    description:
      "Explain how a specific node (function, file, tool, or concept) is connected in the Graphify knowledge graph.",
    promptSnippet: "Explain a function, file, tool, or concept from the project's knowledge graph",
    promptGuidelines: [
      "Use graphify_explain when the user asks what a specific function, file, tool, or concept does.",
      "Use graphify_explain instead of reading source code when the subject is a node in the knowledge graph.",
    ],
    parameters: Type.Object({
      cwd: Type.String({ description: "Working directory of the project to explain." }),
      node: Type.String({
        minLength: 1,
        description: "The node or concept to explain in the graph.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const coordinator = getCoordinator();
      if (!coordinator) {
        return formatGraphifyError(new GraphifyError("MISSING", "Graphify is not initialized."));
      }
      try {
        const result = await coordinator.explain({ ...params, cwd: ctx.cwd });
        return formatGraphifyResult(result);
      } catch (error) {
        return formatGraphifyError(error);
      }
    },
  });
}
