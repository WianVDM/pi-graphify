import assert from "node:assert";
import { describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { allCapabilitiesEnabled, createMockBackend } from "../backends/mock.js";
import { GraphifyCoordinator } from "../coordinator.js";
import { GraphifyError } from "../errors.js";
import { type RegisterToolsOptions, registerGraphifyTools } from "./index.js";

interface ToolRecord {
  name: string;
  label: string;
  description: string;
  parameters: unknown;
  execute: (
    toolCallId: string,
    params: unknown,
    signal: unknown,
    onUpdate: (content: unknown) => void,
    ctx: { cwd: string },
  ) => Promise<{ content: { type: string; text: string }[]; details: Record<string, unknown> }>;
}

interface MockPi {
  tools: Record<string, ToolRecord>;
  registerTool: (tool: ToolRecord) => void;
}

function createMockPi(): MockPi {
  const tools: Record<string, ToolRecord> = {};
  return {
    tools,
    registerTool: (tool: ToolRecord) => {
      tools[tool.name] = tool;
    },
  };
}

function createTestCoordinator(backend = createMockBackend()): GraphifyCoordinator {
  return new GraphifyCoordinator({ cwd: process.cwd(), backend });
}

function createRegisterOptions(): RegisterToolsOptions {
  return { registeredToolNames: new Set<string>() };
}

const noopOnUpdate = (): void => {};

const expectedTools = [
  "graphify_status",
  "graphify_build",
  "graphify_query",
  "graphify_path",
  "graphify_explain",
  "graphify_affected",
  "graphify_version",
];

describe("registerGraphifyTools", () => {
  it("registers all expected tools when all capabilities are enabled", () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    const options = createRegisterOptions();
    registerGraphifyTools(pi as unknown as ExtensionAPI, () => coordinator, options);

    for (const name of expectedTools) {
      assert.ok(name in pi.tools, `expected tool ${name} to be registered`);
    }
  });

  it("does not register tools when coordinator is null", () => {
    const pi = createMockPi();
    const options = createRegisterOptions();
    registerGraphifyTools(pi as unknown as ExtensionAPI, () => null, options);

    assert.equal(Object.keys(pi.tools).length, 0);
  });

  it("skips tools whose capabilities are disabled", () => {
    const pi = createMockPi();
    const capabilities = { ...allCapabilitiesEnabled(), build: false, query: false };
    const backend = createMockBackend({ capabilities });
    const coordinator = createTestCoordinator(backend);
    const options = createRegisterOptions();
    registerGraphifyTools(pi as unknown as ExtensionAPI, () => coordinator, options);

    assert.ok(
      !("graphify_build" in pi.tools),
      "graphify_build should not be registered when build is unsupported",
    );
    assert.ok(
      !("graphify_query" in pi.tools),
      "graphify_query should not be registered when query is unsupported",
    );
    assert.ok(
      "graphify_path" in pi.tools,
      "graphify_path should be registered when path is supported",
    );
  });

  it("prevents duplicate registration when called again with the same set", () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    const options = createRegisterOptions();

    registerGraphifyTools(pi as unknown as ExtensionAPI, () => coordinator, options);
    const firstCount = Object.keys(pi.tools).length;

    registerGraphifyTools(pi as unknown as ExtensionAPI, () => coordinator, options);
    const secondCount = Object.keys(pi.tools).length;

    assert.equal(firstCount, expectedTools.length);
    assert.equal(secondCount, expectedTools.length);
  });
});

async function runTool(
  pi: MockPi,
  name: string,
  params: Record<string, unknown>,
  cwd: string,
): Promise<{ content: { type: string; text: string }[]; details: Record<string, unknown> }> {
  return pi.tools[name].execute("call-1", params, null, noopOnUpdate, { cwd });
}

describe("graphify_build", () => {
  it("returns formatted result on success", async () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(pi, "graphify_build", {}, process.cwd());

    assert.equal(result.content[0].text, "ok: build");
    assert.equal(result.details.exitCode, 0);
    assert.equal(result.details.feature, "build");
  });
});

describe("graphify_query", () => {
  it("passes question and cwd to the coordinator", async () => {
    const pi = createMockPi();
    let captured: unknown = null;
    const backend = createMockBackend({
      run: async (_operation, options) => {
        captured = options;
        return {
          stdout: "answer",
          stderr: "",
          exitCode: 0,
          durationMs: 1,
          backend: "cli",
          feature: "query",
        };
      },
    });
    const coordinator = createTestCoordinator(backend);
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(
      pi,
      "graphify_query",
      { question: "how does auth work?" },
      process.cwd(),
    );

    assert.equal(result.content[0].text, "answer");
    assert.deepEqual(captured, { cwd: process.cwd(), question: "how does auth work?" });
  });

  it("is not registered when the coordinator is missing", () => {
    const pi = createMockPi();
    registerGraphifyTools(pi as unknown as ExtensionAPI, () => null, createRegisterOptions());
    assert.equal("graphify_query" in pi.tools, false);
  });

  it("returns an error when the coordinator becomes null after registration", async () => {
    const pi = createMockPi();
    let coordinator: GraphifyCoordinator | null = createTestCoordinator();
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );

    coordinator = null;
    const result = await runTool(pi, "graphify_query", { question: "x" }, process.cwd());

    assert.ok(result.content[0].text.includes("Graphify is not initialized"));
  });
});

describe("graphify_path", () => {
  it("returns formatted result on success", async () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(pi, "graphify_path", { source: "a", target: "b" }, process.cwd());

    assert.equal(result.content[0].text, "ok: path");
  });
});

describe("graphify_explain", () => {
  it("returns formatted result on success", async () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(pi, "graphify_explain", { node: "auth" }, process.cwd());

    assert.equal(result.content[0].text, "ok: explain");
  });
});

describe("graphify_affected", () => {
  it("returns formatted result on success", async () => {
    const pi = createMockPi();
    const coordinator = createTestCoordinator();
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(
      pi,
      "graphify_affected",
      { files: ["src/auth.ts"] },
      process.cwd(),
    );

    assert.equal(result.content[0].text, "ok: affected");
  });
});

describe("graphify_version", () => {
  it("returns formatted version on success", async () => {
    const pi = createMockPi();
    const backend = createMockBackend({ version: "2.100.0" });
    const coordinator = createTestCoordinator(backend);
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(pi, "graphify_version", {}, process.cwd());

    assert.equal(result.content[0].text, "2.100.0");
  });
});

describe("tool error handling", () => {
  it("returns friendly error when the backend throws GraphifyError", async () => {
    const pi = createMockPi();
    const backend = createMockBackend({
      run: async () => {
        throw new GraphifyError("QUERY", "graphify query failed");
      },
    });
    const coordinator = createTestCoordinator(backend);
    registerGraphifyTools(
      pi as unknown as ExtensionAPI,
      () => coordinator,
      createRegisterOptions(),
    );
    const result = await runTool(pi, "graphify_query", { question: "x" }, process.cwd());

    assert.ok(result.content[0].text.includes("graphify query failed"));
  });
});
