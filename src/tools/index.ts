import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { GraphifyCapabilities } from "../backends/types.js";
import type { CoordinatorProvider, GraphifyCoordinator } from "../coordinator.js";
import { registerAffectedTool } from "./affected.js";
import { registerBuildTool } from "./build.js";
import { registerExplainTool } from "./explain.js";
import { registerPathTool } from "./path.js";
import { registerQueryTool } from "./query.js";
import { registerStatusTool } from "./status.js";
import { registerVersionTool } from "./version.js";

export type { CoordinatorProvider } from "../coordinator.js";

export interface RegisterToolsOptions {
  /** Tracks tool names that have already been registered to prevent duplicates. */
  registeredToolNames: Set<string>;
}

export function registerGraphifyTools(
  pi: ExtensionAPI,
  getCoordinator: CoordinatorProvider,
  options: RegisterToolsOptions,
): void {
  const { registeredToolNames } = options;
  const coordinator = getCoordinator();
  if (!coordinator) {
    return;
  }

  registerToolIfSupported(coordinator, registeredToolNames, "graphify_status", () =>
    registerStatusTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_build", () =>
    registerBuildTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_query", () =>
    registerQueryTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_path", () =>
    registerPathTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_explain", () =>
    registerExplainTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_affected", () =>
    registerAffectedTool(pi, getCoordinator),
  );
  registerToolIfSupported(coordinator, registeredToolNames, "graphify_version", () =>
    registerVersionTool(pi, getCoordinator),
  );
}

function registerToolIfSupported(
  coordinator: GraphifyCoordinator,
  registeredToolNames: Set<string>,
  name: string,
  register: () => void,
): void {
  if (registeredToolNames.has(name)) {
    return;
  }

  const feature = nameToFeature(name);
  if (feature && !coordinator.supports(feature)) {
    return;
  }

  registeredToolNames.add(name);
  register();
}

function nameToFeature(name: string): keyof GraphifyCapabilities | null {
  switch (name) {
    case "graphify_build":
      return "build";
    case "graphify_query":
      return "query";
    case "graphify_path":
      return "path";
    case "graphify_explain":
      return "explain";
    case "graphify_affected":
      return "affected";
    case "graphify_version":
      return "version";
    default:
      return null;
  }
}
