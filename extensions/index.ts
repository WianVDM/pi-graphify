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
import { GraphifyCoordinator } from "../src/coordinator.js";
import { buildGraphifyHint, graphifyStatus } from "../src/graphify.js";
import { registerGraphifyTools } from "../src/tools/index.js";

export default function (pi: ExtensionAPI) {
  // Coordinator is created per session and shared by tools and commands.
  let coordinator: GraphifyCoordinator | null = null;
  const getCoordinator = () => coordinator;

  // ── 1. Register tools and commands synchronously ──────────────────
  registerGraphifyTools(pi, getCoordinator);

  pi.registerCommand("graphify-status", {
    description: "Show Graphify graph status for the current project",
    handler: async (_args, ctx) => {
      const current = getCoordinator();
      if (!current) {
        ctx.ui.notify("Graphify is not initialized.", "warning");
        return;
      }

      const status = await current.status({ cwd: ctx.cwd });
      if (status.hasGraph && status.graphPath) {
        ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
      } else {
        ctx.ui.notify("No Graphify graph found. Run /graphify-build to create one.", "warning");
      }
    },
  });

  // ── 2. Initialize coordinator per session ─────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    coordinator = new GraphifyCoordinator({ cwd: ctx.cwd });
    await coordinator.initialize();

    const status = await coordinator.status({ cwd: ctx.cwd });
    if (status.hasGraph && status.graphPath) {
      ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
    }

    for (const warning of coordinator.warnings) {
      ctx.ui.notify(warning, "warning");
    }
  });

  // ── 3. Inject context hint when a graph is present ────────────────
  pi.on("before_agent_start", async (event, ctx) => {
    const status = graphifyStatus(ctx.cwd);
    if (!status.hasGraph || !status.graphPath) {
      return;
    }

    const hint = buildGraphifyHint(status.graphPath);
    return {
      systemPrompt: `${event.systemPrompt}\n\n${hint}`,
    };
  });

  // ── 4. Clean up coordinator on shutdown ─────────────────────────
  pi.on("session_shutdown", async () => {
    if (coordinator) {
      await coordinator.close();
      coordinator = null;
    }
  });
}
