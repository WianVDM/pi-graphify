/**
 * Shared types for Graphify slash commands.
 *
 * Command executors receive a narrow subset of ExtensionCommandContext so they
 * are easy to test with mock contexts.
 */

import type { ExtensionCommandContext, ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { GraphifyCapabilities } from "../backends/types.js";
import type { CoordinatorProvider } from "../coordinator.js";

export type ExtensionMode = "tui" | "rpc" | "json" | "print";

/** UI surface needed by command executors and the unified menu. */
export interface CommandUIContext
  extends Pick<ExtensionUIContext, "notify" | "input" | "select" | "custom"> {}

/** Context passed to every command executor. */
export interface CommandContext {
  cwd: string;
  ui: CommandUIContext;
  hasUI: boolean;
  mode: ExtensionMode;
  isProjectTrusted(): boolean;
}

/** Function signature for a command executor. */
export type CommandExecutor = (
  ctx: CommandContext,
  getCoordinator: CoordinatorProvider,
  args: string,
) => Promise<void>;

/** How a command collects arguments from the unified menu. */
export type CommandArgMode = "none" | "input" | "flags";

/** Static metadata and runtime executor for one slash command. */
export interface CommandDefinition {
  /** Slash command name, e.g. "graphify-build". */
  name: string;

  /** Menu label, e.g. "Build graph". */
  label: string;

  /** Description shown in the menu and in Pi's command list. */
  description: string;

  /** Short description shown in the unified /graphify menu overlay. */
  menuDescription?: string;

  /** Required Graphify capability. */
  feature: keyof GraphifyCapabilities;

  /** Usage string shown when arguments are invalid. */
  usage: string;

  /** How the menu collects arguments. */
  argMode: CommandArgMode;

  /** Title for ctx.ui.input when argMode is "input" or "flags". */
  prompt?: string;

  /** Placeholder for ctx.ui.input. */
  placeholder?: string;

  /** Execute the command with the given raw argument string. */
  execute: CommandExecutor;
}

/** Narrow an ExtensionCommandContext to the CommandContext shape. */
export function toCommandContext(ctx: ExtensionCommandContext): CommandContext {
  return {
    cwd: ctx.cwd,
    ui: ctx.ui,
    hasUI: ctx.hasUI,
    mode: ctx.mode as ExtensionMode,
    isProjectTrusted: ctx.isProjectTrusted,
  };
}
