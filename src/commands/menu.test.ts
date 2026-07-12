/**
 * Tests for the unified /graphify menu.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { allCapabilitiesEnabled, createMockBackend } from "../backends/mock.js";
import { buildMenuItems, registerGraphifyMenuCommand } from "./menu.js";
import { queryCommand } from "./query.js";
import { graphifyCommands } from "./registry.js";
import { createTestCoordinator, getCoordinator } from "./test-helpers.js";
import type { CommandContext } from "./types.js";
import { versionCommand } from "./version.js";

interface Notification {
  message: string;
  type?: "info" | "warning" | "error";
}

interface MockUi {
  notifications: Notification[];
  selectCalls: Array<{ title: string; options: string[] }>;
  inputCalls: Array<{ title: string; placeholder?: string }>;
  customCalls: unknown[];
  customResult: string | null;
  selectResult: string | undefined;
  inputResult: string | undefined;
}

interface MockContextResult {
  ctx: CommandContext;
  ui: MockUi;
}

function createMockContext(overrides: Partial<CommandContext> = {}): MockContextResult {
  const ui: MockUi = {
    notifications: [],
    selectCalls: [],
    inputCalls: [],
    customCalls: [],
    customResult: null,
    selectResult: undefined,
    inputResult: undefined,
  };

  const ctx: CommandContext = {
    cwd: process.cwd(),
    hasUI: true,
    mode: "tui",
    isProjectTrusted: () => true,
    ui: {
      notify: (message, type) => ui.notifications.push({ message, type }),
      input: async (title, placeholder) => {
        ui.inputCalls.push({ title, placeholder });
        return ui.inputResult;
      },
      select: async (title, options) => {
        ui.selectCalls.push({ title, options });
        return ui.selectResult;
      },
      custom: async (factory) => {
        ui.customCalls.push(factory);
        return ui.customResult as never;
      },
    },
    ...overrides,
  };

  return { ctx, ui };
}

interface CommandHandler {
  description?: string;
  handler: (args: string, ctx: unknown) => Promise<void>;
}

interface MockPi {
  commands: Record<string, CommandHandler>;
  registerCommand: (name: string, options: CommandHandler) => void;
}

function createMockPi(): MockPi {
  const commands: MockPi["commands"] = {};
  return {
    commands,
    registerCommand: (name, options) => {
      commands[name] = options;
    },
  };
}

function invokeHandler(pi: MockPi, ctx: CommandContext): Promise<void> {
  return pi.commands.graphify.handler(
    "",
    ctx as unknown as Parameters<CommandHandler["handler"]>[1],
  );
}

describe("registerGraphifyMenuCommand", () => {
  it("registers /graphify", () => {
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, () => null);

    assert.ok("graphify" in pi.commands);
    assert.equal(pi.commands.graphify.description, "Open the Graphify command menu");
  });
});

describe("buildMenuItems", () => {
  it("maps commands to SelectItem values", () => {
    const items = buildMenuItems(graphifyCommands);

    assert.equal(items.length, graphifyCommands.length);
    for (const command of graphifyCommands) {
      assert.ok(items.some((item) => item.value === command.name && item.label === command.label));
    }
  });
});

describe("showGraphifyMenu TUI mode", () => {
  it("calls ctx.ui.custom when commands are available", async () => {
    const { ctx, ui } = createMockContext();
    ui.customResult = "graphify-status";
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.customCalls.length, 1);
    assert.equal(ui.notifications.length, 1);
    assert.ok(ui.notifications[0].message.includes("Graphify graph ready"));
  });

  it("renders the menu with the correct items", () => {
    const { ctx, ui } = createMockContext();
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    invokeHandler(pi, ctx);

    const factory = ui.customCalls[0] as (
      tui: unknown,
      theme: unknown,
      kb: unknown,
      done: (value: string | null) => void,
    ) => { render: (width: number) => string[] };
    const mockTheme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
    };
    const component = factory({ requestRender: () => {} }, mockTheme, {}, () => {});
    const lines = component.render(80);

    for (const command of graphifyCommands) {
      assert.ok(
        lines.some((line) => line.includes(command.label)),
        `expected menu to contain ${command.label}`,
      );
    }
  });

  it("warns when no commands are available", async () => {
    const { ctx, ui } = createMockContext();
    const backend = createMockBackend({
      capabilities: {
        ...allCapabilitiesEnabled(),
        build: false,
        query: false,
        path: false,
        explain: false,
        affected: false,
        status: false,
        version: false,
      },
    });
    const coordinator = createTestCoordinator(backend);
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.customCalls.length, 0);
    assert.equal(ui.notifications[0].type, "warning");
    assert.ok(ui.notifications[0].message.includes("No Graphify commands are available"));
  });

  it("cancels without executing when custom returns null", async () => {
    const { ctx, ui } = createMockContext();
    ui.customResult = null;
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.customCalls.length, 1);
    assert.equal(ui.notifications.length, 0);
  });

  it("prompts for input and executes arg commands", async () => {
    const { ctx, ui } = createMockContext();
    ui.customResult = "graphify-query";
    ui.inputResult = "how does auth work?";
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.inputCalls.length, 1);
    assert.equal(ui.inputCalls[0].title, queryCommand.prompt);
    assert.equal(ui.notifications[0].message, "ok: query");
  });

  it("cancels when input is cancelled", async () => {
    const { ctx, ui } = createMockContext();
    ui.customResult = "graphify-query";
    ui.inputResult = undefined;
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.inputCalls.length, 1);
    assert.equal(ui.notifications.length, 0);
  });
});

describe("showGraphifyMenu RPC mode", () => {
  it("uses ctx.ui.select when in rpc mode", async () => {
    const { ctx, ui } = createMockContext({ mode: "rpc" });
    ui.selectResult = `${versionCommand.label}: ${versionCommand.description}`;
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.selectCalls.length, 1);
    assert.equal(ui.selectCalls[0].title, "Graphify");
    assert.equal(ui.notifications[0].message, "2.100.0");
  });

  it("does not execute when select is cancelled", async () => {
    const { ctx, ui } = createMockContext({ mode: "rpc" });
    ui.selectResult = undefined;
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.selectCalls.length, 1);
    assert.equal(ui.notifications.length, 0);
  });
});

describe("showGraphifyMenu non-UI mode", () => {
  it("returns silently when hasUI is false", async () => {
    const { ctx, ui } = createMockContext({ hasUI: false });
    const coordinator = createTestCoordinator();
    const pi = createMockPi();
    registerGraphifyMenuCommand(pi as unknown as ExtensionAPI, getCoordinator(coordinator));
    await invokeHandler(pi, ctx);

    assert.equal(ui.customCalls.length, 0);
    assert.equal(ui.selectCalls.length, 0);
    assert.equal(ui.notifications.length, 0);
  });
});
