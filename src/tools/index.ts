/**
 * Tool registration barrel
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { GraphifyConfig } from "../config.js";
import { registerStatusTool } from "./status.js";

export function registerGraphifyTools(pi: ExtensionAPI, config: GraphifyConfig): void {
  registerStatusTool(pi, config);
}
