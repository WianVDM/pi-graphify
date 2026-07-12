/**
 * Tests for Graphify slash command executors, parsing, and registry.
 */

import assert from "node:assert";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { allCapabilitiesEnabled, createMockBackend } from "../backends/mock.js";
import { GraphifyCoordinator } from "../coordinator.js";
import { GraphifyError } from "../errors.js";
import { affectedCommand } from "./affected.js";
import { buildCommand } from "./build.js";
import { explainCommand } from "./explain.js";
import { parseBooleanFlag, splitArgs } from "./parse.js";
import { pathCommand } from "./path.js";
import { queryCommand } from "./query.js";
import { getAvailableCommands, graphifyCommands } from "./registry.js";
import { statusCommand } from "./status.js";
import { createTestCoordinator, getCoordinator } from "./test-helpers.js";
import type { CommandContext } from "./types.js";
import { versionCommand } from "./version.js";

const TRUNCATION_TEST_OUTPUT_LENGTH = 2000;
const TRUNCATION_TEST_ASSERTION_LIMIT = 1100;

interface Notification {
  message: string;
  type?: "info" | "warning" | "error";
}

interface MockContextResult {
  ctx: CommandContext;
  notifications: Notification[];
}

function createMockContext(overrides: Partial<CommandContext> = {}): MockContextResult {
  const notifications: Notification[] = [];

  const ctx: CommandContext = {
    cwd: process.cwd(),
    hasUI: true,
    mode: "tui",
    isProjectTrusted: () => true,
    ui: {
      notify: (message, type) => notifications.push({ message, type }),
      input: async () => undefined,
      select: async () => undefined,
      custom: async () => null as never,
    },
    ...overrides,
  };

  return { ctx, notifications };
}

const expectedCommands = [
  "graphify-build",
  "graphify-query",
  "graphify-path",
  "graphify-explain",
  "graphify-affected",
  "graphify-status",
  "graphify-version",
];

describe("graphifyCommands registry", () => {
  it("contains all expected commands", () => {
    const names = graphifyCommands.map((c) => c.name);
    for (const name of expectedCommands) {
      assert.ok(names.includes(name), `expected command ${name}`);
    }
  });

  it("filters commands by capability", () => {
    const backend = createMockBackend({
      capabilities: { ...allCapabilitiesEnabled(), build: false, query: false },
    });
    const coordinator = createTestCoordinator(backend);
    const available = getAvailableCommands(coordinator, graphifyCommands).map((c) => c.name);

    assert.ok(!available.includes("graphify-build"));
    assert.ok(!available.includes("graphify-query"));
    assert.ok(available.includes("graphify-path"));
  });

  it("returns no commands when coordinator is null", () => {
    const available = getAvailableCommands(null, graphifyCommands);
    assert.equal(available.length, 0);
  });
});

describe("splitArgs", () => {
  it("splits on whitespace", () => {
    assert.deepEqual(splitArgs("a b c"), ["a", "b", "c"]);
  });

  it("preserves quoted strings", () => {
    assert.deepEqual(splitArgs('a "b c" d'), ["a", "b c", "d"]);
    assert.deepEqual(splitArgs("a 'b c' d"), ["a", "b c", "d"]);
  });

  it("returns an empty array for empty input", () => {
    assert.deepEqual(splitArgs(""), []);
  });
});

describe("parseBooleanFlag", () => {
  it("detects a bare flag", () => {
    const result = parseBooleanFlag(["--flag"], "flag");
    assert.equal(result.value, true);
    assert.deepEqual(result.rest, []);
  });

  it("detects --flag=true and --flag=false", () => {
    const result = parseBooleanFlag(["--flag=true"], "flag", true);
    assert.equal(result.value, true);
    const result2 = parseBooleanFlag(["--flag=false"], "flag", true);
    assert.equal(result2.value, false);
  });

  it("leaves unrelated tokens in rest", () => {
    const result = parseBooleanFlag(["--code-only", "src/index.ts"], "code-only");
    assert.equal(result.value, true);
    assert.deepEqual(result.rest, ["src/index.ts"]);
  });

  it("throws on invalid flag value", () => {
    assert.throws(() => parseBooleanFlag(["--flag=maybe"], "flag", true));
  });
});

describe("executeStatus", () => {
  it("notifies when graph is ready", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await statusCommand.execute(ctx, getCoordinator(coordinator), "");

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].type, "info");
    assert.ok(notifications[0].message.includes("Graphify graph ready"));
  });

  it("warns when graph is missing", async () => {
    const cwd = "/tmp/no-graph-here";
    const { ctx, notifications } = createMockContext({ cwd });
    const customCoordinator = new GraphifyCoordinator({
      cwd,
      backend: createMockBackend(),
    });
    await statusCommand.execute(ctx, getCoordinator(customCoordinator), "");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.includes("No Graphify graph found"));
  });

  it("warns when coordinator is uninitialized", async () => {
    const { ctx, notifications } = createMockContext();
    await statusCommand.execute(ctx, getCoordinator(null), "");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.includes("not initialized"));
  });

  it("returns silently when hasUI is false", async () => {
    const { ctx, notifications } = createMockContext({ hasUI: false });
    const coordinator = createTestCoordinator();
    await statusCommand.execute(ctx, getCoordinator(coordinator), "");

    assert.equal(notifications.length, 0);
  });
});

describe("executeVersion", () => {
  it("shows the installed version", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await versionCommand.execute(ctx, getCoordinator(coordinator), "");

    assert.equal(notifications[0].message, "2.100.0");
  });

  it("warns when version is unsupported", async () => {
    const { ctx, notifications } = createMockContext();
    const backend = createMockBackend({
      capabilities: { ...allCapabilitiesEnabled(), version: false },
    });
    const coordinator = createTestCoordinator(backend);
    await versionCommand.execute(ctx, getCoordinator(coordinator), "");

    assert.equal(notifications[0].type, "warning");
  });
});

describe("executeBuild", () => {
  it("builds the graph with default options", async () => {
    const { ctx, notifications } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const customCoordinator = createTestCoordinator(backend);
    await buildCommand.execute(ctx, getCoordinator(customCoordinator), "");

    assert.deepEqual(captured, {
      cwd: process.cwd(),
      codeOnly: undefined,
      update: undefined,
      directed: undefined,
    });
    assert.equal(notifications[0].type, "info");
    assert.ok(notifications[0].message.includes("ok: build"));
  });

  it("parses flags", async () => {
    const { ctx } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const coordinator = createTestCoordinator(backend);
    await buildCommand.execute(ctx, getCoordinator(coordinator), "--code-only --update --directed");

    assert.deepEqual(captured, {
      cwd: process.cwd(),
      codeOnly: true,
      update: true,
      directed: true,
    });
  });

  it("shows usage on unknown flags", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await buildCommand.execute(ctx, getCoordinator(coordinator), "--bad-flag");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.startsWith("Usage: /graphify-build"));
  });

  it("warns when project is not trusted", async () => {
    const { ctx, notifications } = createMockContext({ isProjectTrusted: () => false });
    const coordinator = createTestCoordinator();
    await buildCommand.execute(ctx, getCoordinator(coordinator), "");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.includes("trust"));
  });
});

describe("executeQuery", () => {
  it("passes the question to the coordinator", async () => {
    const { ctx, notifications } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return {
          stdout: "answer",
          stderr: "",
          exitCode: 0,
          durationMs: 1,
          backend: "cli",
          feature: operation,
        };
      },
    });
    const coordinator = createTestCoordinator(backend);
    await queryCommand.execute(ctx, getCoordinator(coordinator), "how does auth work?");

    assert.deepEqual(captured, { cwd: process.cwd(), question: "how does auth work?" });
    assert.equal(notifications[0].message, "answer");
  });

  it("shows usage when question is empty", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await queryCommand.execute(ctx, getCoordinator(coordinator), "  ");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.includes("Usage"));
  });
});

describe("executePath", () => {
  it("requires source and target", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await pathCommand.execute(ctx, getCoordinator(coordinator), "only-one");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.startsWith("Usage: /graphify-path"));
  });

  it("passes source and target to the coordinator", async () => {
    const { ctx, notifications } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const coordinator = createTestCoordinator(backend);
    await pathCommand.execute(ctx, getCoordinator(coordinator), "src/a.ts src/b.ts");

    assert.deepEqual(captured, { cwd: process.cwd(), source: "src/a.ts", target: "src/b.ts" });
    assert.ok(notifications[0].message.includes("ok: path"));
  });

  it("handles quoted arguments", async () => {
    const { ctx } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const coordinator = createTestCoordinator(backend);
    await pathCommand.execute(ctx, getCoordinator(coordinator), '"src/a.ts" "src/b.ts"');

    assert.deepEqual(captured, { cwd: process.cwd(), source: "src/a.ts", target: "src/b.ts" });
  });
});

describe("executeExplain", () => {
  it("shows usage when node is empty", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await explainCommand.execute(ctx, getCoordinator(coordinator), "  ");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.includes("Usage"));
  });

  it("passes the node to the coordinator", async () => {
    const { ctx } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const coordinator = createTestCoordinator(backend);
    await explainCommand.execute(ctx, getCoordinator(coordinator), "auth");

    assert.deepEqual(captured, { cwd: process.cwd(), node: "auth" });
  });
});

describe("executeAffected", () => {
  it("shows usage when no files are given", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await affectedCommand.execute(ctx, getCoordinator(coordinator), "  ");

    assert.equal(notifications[0].type, "warning");
    assert.ok(notifications[0].message.startsWith("Usage: /graphify-affected"));
  });

  it("rejects paths outside the project", async () => {
    const { ctx, notifications } = createMockContext();
    const coordinator = createTestCoordinator();
    await affectedCommand.execute(ctx, getCoordinator(coordinator), "../escape.ts");

    assert.equal(notifications[0].type, "error");
    assert.ok(notifications[0].message.includes("outside the project"));
  });

  it("passes absolute paths to the coordinator", async () => {
    const { ctx, notifications } = createMockContext();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (operation, options) => {
        captured = options;
        return createMockBackend().run(operation, options);
      },
    });
    const coordinator = createTestCoordinator(backend);
    await affectedCommand.execute(ctx, getCoordinator(coordinator), "src/index.ts");

    const expected = { cwd: process.cwd(), files: [resolve(process.cwd(), "src/index.ts")] };
    assert.deepEqual(captured, expected);
    assert.ok(notifications[0].message.includes("ok: affected"));
  });
});

describe("command error handling", () => {
  it("handles GraphifyError from the coordinator", async () => {
    const { ctx, notifications } = createMockContext();
    const backend = createMockBackend({
      run: async () => {
        throw new GraphifyError("QUERY", "query failed");
      },
    });
    const coordinator = createTestCoordinator(backend);
    await queryCommand.execute(ctx, getCoordinator(coordinator), "x");

    assert.equal(notifications[0].message, "query failed");
    assert.equal(notifications[0].type, "warning");
  });

  it("handles unexpected errors as errors", async () => {
    const { ctx, notifications } = createMockContext();
    const backend = createMockBackend({
      run: async () => {
        throw new Error("boom");
      },
    });
    const coordinator = createTestCoordinator(backend);
    await queryCommand.execute(ctx, getCoordinator(coordinator), "x");

    assert.equal(notifications[0].type, "error");
    assert.equal(notifications[0].message, "boom");
  });

  it("truncates long output", async () => {
    const { ctx, notifications } = createMockContext();
    const longOutput = "a".repeat(TRUNCATION_TEST_OUTPUT_LENGTH);
    const backend = createMockBackend({
      run: async () => ({
        stdout: longOutput,
        stderr: "",
        exitCode: 0,
        durationMs: 1,
        backend: "cli",
        feature: "query",
      }),
    });
    const coordinator = createTestCoordinator(backend);
    await queryCommand.execute(ctx, getCoordinator(coordinator), "x");

    assert.ok(notifications[0].message.endsWith("... (truncated)"));
    assert.ok(notifications[0].message.length < TRUNCATION_TEST_ASSERTION_LIMIT);
  });
});
