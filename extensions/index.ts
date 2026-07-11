/**
 * pi-graphify — Extension entry point
 *
 * Brings Graphify knowledge graph capabilities into Pi sessions:
 *   - Detects existing graphify-out/graph.json in the project
 *   - Registers LLM-callable tools (graphify_status, graphify_query, ...)
 *   - Registers slash commands (/graphify-build, /graphify-status, ...)
 *   - Optionally watches source files for incremental rebuilds
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "../src/config.js";
import { buildGraphifyHint, graphifyStatus } from "../src/graphify.js";
import { registerGraphifyTools } from "../src/tools/index.js";

export default function (pi: ExtensionAPI) {
  const config = loadConfig();

  // ── 1. Notify and inject context when a graph is present ──────────
  pi.on("session_start", async (_event, ctx) => {
    const status = await graphifyStatus(ctx.cwd);
    if (status.hasGraph && status.graphPath) {
      ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
    }
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const status = await graphifyStatus(ctx.cwd);
    if (!status.hasGraph || !status.graphPath) {
      return;
    }

    const hint = buildGraphifyHint(status.graphPath);
    return {
      systemPrompt: `${event.systemPrompt}\n\n${hint}`,
    };
  });

  // ── 2. Register custom tools the LLM can call ─────────────────────
  registerGraphifyTools(pi, config);

  // ── 3. Register slash commands ────────────────────────────────────
  pi.registerCommand("graphify-status", {
    description: "Show Graphify graph status for the current project",
    handler: async (_args, ctx) => {
      const status = await graphifyStatus(ctx.cwd);
      if (status.hasGraph && status.graphPath) {
        ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
      } else {
        ctx.ui.notify("No Graphify graph found. Run /graphify-build to create one.", "warning");
      }
    },
  });
}
