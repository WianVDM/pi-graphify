import type { GraphifyBackend, GraphifyCapabilities, GraphifyResult } from "./types.js";

export const allCapabilitiesEnabled = (): GraphifyCapabilities => ({
  build: true,
  query: true,
  path: true,
  explain: true,
  affected: true,
  add: true,
  watch: true,
  reflect: true,
  mcp: true,
  status: true,
  version: true,
  directedGraph: true,
  incrementalUpdate: true,
  semanticExtraction: true,
});

export interface MockBackendOptions {
  version?: string;
  capabilities?: GraphifyCapabilities;
  run?: (operation: string, options: unknown) => Promise<GraphifyResult>;
}

export function createMockBackend(options: MockBackendOptions = {}): GraphifyBackend {
  const {
    version = "2.100.0",
    capabilities = allCapabilitiesEnabled(),
    run = async (operation) => ({
      stdout: `ok: ${operation}`,
      stderr: "",
      exitCode: 0,
      durationMs: 1,
      backend: "cli",
      feature: operation,
    }),
  } = options;

  return {
    type: "cli",
    version,
    capabilities,
    run,
    close: async () => {},
  };
}
