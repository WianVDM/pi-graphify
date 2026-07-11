/**
 * Tool registration barrel
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerStatusTool } from "./status.js";

export type CoordinatorProvider = () => import("../coordinator.js").GraphifyCoordinator | null;

export function registerGraphifyTools(pi: ExtensionAPI, getCoordinator: CoordinatorProvider): void {
  registerStatusTool(pi, getCoordinator);
}
