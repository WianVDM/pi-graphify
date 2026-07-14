/**
 * pi-graphify — Extension entry point
 *
 * Brings Graphify knowledge graph capabilities into Pi sessions:
 *   - Detects existing graphify-out/graph.json in the project
 *   - Registers LLM-callable tools (graphify_status, graphify_query, ...)
 *   - Registers slash commands (/graphify-status, ...)
 *   - Optionally watches source files for incremental rebuilds
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerGraphifyCommands } from "../src/commands/index.js";
import { registerGraphifyMenuCommand } from "../src/commands/menu.js";
import { GraphifyCoordinator } from "../src/coordinator.js";
import { buildGraphifyHint, graphifyStatus } from "../src/graphify.js";
import { registerGraphifyTools } from "../src/tools/index.js";

export default function (pi: ExtensionAPI) {
  // Coordinator is created per session and shared by tools and commands.
  let coordinator: GraphifyCoordinator | null = null;
  const getCoordinator = () => coordinator;
  const registeredToolNames = new Set<string>();
  let commandsRegistered = false;

  // ── 1. Initialize coordinator and register tools per session ───────
  // Tools and commands are registered inside session_start so we can gate them
  // by the coordinator's detected capabilities and the current run mode.
  // Commands are mode-specific: the unified /graphify menu is shown in TUI;
  // individual /graphify-* commands are shown in non-TUI modes.
  pi.on("session_start", async (_event, ctx) => {
    coordinator = new GraphifyCoordinator({ cwd: ctx.cwd });
    await coordinator.initialize();

    if (!commandsRegistered) {
      commandsRegistered = true;
      if (ctx.mode === "tui") {
        registerGraphifyMenuCommand(pi, getCoordinator);
      } else {
        registerGraphifyCommands(pi, getCoordinator);
      }
    }

    registerGraphifyTools(pi, getCoordinator, { registeredToolNames });

    const status = await coordinator.status({ cwd: ctx.cwd });
    if (status.hasGraph && status.graphPath) {
      ctx.ui.notify(`Graphify graph ready: ${status.graphPath}`, "info");
    }

    if (coordinator.version === null) {
      ctx.ui.notify(
        "Graphify CLI was not detected on PATH. Install Graphify to use build, query, and other graph tools.",
        "warning",
      );
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
