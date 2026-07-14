/**
 * /graphify — unified command menu.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@earendil-works/pi-tui";
import type { CoordinatorProvider } from "../coordinator.js";
import { getAvailableCommands, graphifyCommands } from "./registry.js";
import type { CommandContext, CommandDefinition } from "./types.js";
import { toCommandContext } from "./types.js";

const MAX_MENU_VISIBLE_ITEMS = 10;

export function registerGraphifyMenuCommand(
  pi: ExtensionAPI,
  getCoordinator: CoordinatorProvider,
): void {
  pi.registerCommand("graphify", {
    description: "Open the Graphify command menu",
    handler: async (_args, ctx) => {
      const commandCtx = toCommandContext(ctx);
      await showGraphifyMenu(commandCtx, getCoordinator);
    },
  });
}

async function showGraphifyMenu(
  ctx: CommandContext,
  getCoordinator: CoordinatorProvider,
): Promise<void> {
  if (!ctx.hasUI) return;

  const coordinator = getCoordinator();
  if (!coordinator) {
    ctx.ui.notify("Graphify is not initialized.", "warning");
    return;
  }

  const availableCommands = getAvailableCommands(coordinator, graphifyCommands);
  if (availableCommands.length === 0) {
    ctx.ui.notify("No Graphify commands are available for this installation.", "warning");
    return;
  }

  const selectedName = await selectCommandName(ctx, availableCommands);
  await runSelectedCommand(ctx, getCoordinator, availableCommands, selectedName);
}

async function selectCommandName(
  ctx: CommandContext,
  availableCommands: CommandDefinition[],
): Promise<string | null | undefined> {
  if (ctx.mode === "tui") return showTuiMenu(ctx, availableCommands);
  if (ctx.mode === "rpc") return showRpcMenu(ctx, availableCommands);
  return undefined;
}

async function runSelectedCommand(
  ctx: CommandContext,
  getCoordinator: CoordinatorProvider,
  availableCommands: CommandDefinition[],
  selectedName: string | null | undefined,
): Promise<void> {
  if (!selectedName) return;
  await executeMenuChoice(ctx, getCoordinator, availableCommands, selectedName);
}

async function showTuiMenu(
  ctx: CommandContext,
  availableCommands: CommandDefinition[],
): Promise<string | null> {
  const items = buildMenuItems(availableCommands);

  return ctx.ui.custom<string | null>(
    (tui, theme, _kb, done) => {
      const container = new Container();
      container.addChild(new DynamicBorder((str) => theme.fg("accent", str)));
      container.addChild(new Text(theme.fg("accent", theme.bold(" Graphify "))));

      const selectList = new SelectList(items, Math.min(items.length, MAX_MENU_VISIBLE_ITEMS), {
        selectedPrefix: (text) => theme.fg("accent", text),
        selectedText: (text) => theme.fg("accent", text),
        description: (text) => theme.fg("muted", text),
        scrollInfo: (text) => theme.fg("dim", text),
        noMatch: (text) => theme.fg("warning", text),
      });

      selectList.onSelect = (item) => done(item.value);
      selectList.onCancel = () => done(null);
      container.addChild(selectList);
      container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel")));
      container.addChild(new DynamicBorder((str) => theme.fg("accent", str)));

      return {
        render: (width) => container.render(width),
        invalidate: () => container.invalidate(),
        handleInput: (data) => {
          selectList.handleInput(data);
          tui.requestRender();
        },
      };
    },
    { overlay: true },
  );
}

async function showRpcMenu(
  ctx: CommandContext,
  availableCommands: CommandDefinition[],
): Promise<string | undefined> {
  const choices = availableCommands.map((command) => ({
    label: `${command.label}: ${command.description}`,
    value: command.name,
  }));
  const labels = choices.map((c) => c.label);
  const selectedLabel = await ctx.ui.select("Graphify", labels);
  return choices.find((c) => c.label === selectedLabel)?.value;
}

export function buildMenuItems(availableCommands: CommandDefinition[]): SelectItem[] {
  return availableCommands.map((command) => ({
    value: command.name,
    label: command.label,
    description: command.menuDescription ?? command.description,
  }));
}

async function executeMenuChoice(
  ctx: CommandContext,
  getCoordinator: CoordinatorProvider,
  availableCommands: CommandDefinition[],
  selectedName: string,
): Promise<void> {
  const selectedCommand = availableCommands.find((c) => c.name === selectedName);
  if (!selectedCommand) return;

  if (selectedCommand.argMode === "none") {
    await selectedCommand.execute(ctx, getCoordinator, "");
    return;
  }

  const input = await ctx.ui.input(
    selectedCommand.prompt ?? selectedCommand.label,
    selectedCommand.placeholder,
  );
  if (input === undefined) return;

  if (selectedCommand.argMode === "input" && input.trim() === "") {
    await selectedCommand.execute(ctx, getCoordinator, "");
    return;
  }

  await selectedCommand.execute(ctx, getCoordinator, input);
}
