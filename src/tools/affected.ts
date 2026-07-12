import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { GraphifyError } from "../errors.js";
import { formatGraphifyError, formatGraphifyResult } from "./format.js";
import type { CoordinatorProvider } from "./index.js";

export function registerAffectedTool(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  pi.registerTool({
    name: "graphify_affected",
    label: "Graphify Affected",
    description: "Show the blast radius of changes to the given files or nodes.",
    parameters: Type.Object({
      cwd: Type.String({ description: "Working directory of the project to analyze." }),
      files: Type.Array(Type.String({ minLength: 1 }), {
        minItems: 1,
        description: "The files or nodes whose downstream dependents should be reported.",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const coordinator = getCoordinator();
      if (!coordinator) {
        return formatGraphifyError(new GraphifyError("MISSING", "Graphify is not initialized."));
      }
      try {
        const result = await coordinator.affected({ ...params, cwd: ctx.cwd });
        return formatGraphifyResult(result);
      } catch (error) {
        return formatGraphifyError(error);
      }
    },
  });
}
