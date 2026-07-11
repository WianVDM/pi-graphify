/**
 * Graphify CLI version detection and capability matrix.
 */

import { execFile } from "node:child_process";
import type { GraphifyCapabilities } from "./backends/types.js";

/** Minimum Graphify CLI version considered supported. */
export const MIN_SUPPORTED_GRAPHIFY = "2.100.0";

export interface GraphifyVersionInfo {
  /** Detected version, or null if unknown. */
  version: string | null;
  /** Whether the detected version is at or above the minimum. */
  isSupported: boolean;
  /** Human-readable warnings about version/capability issues. */
  warnings: string[];
}

/** Run a command to detect the Graphify version. */
export async function detectVersion(cli: string, cwd: string): Promise<GraphifyVersionInfo> {
  const warnings: string[] = [];

  let version: string | null = null;
  for (const args of [["--version"], ["version"]]) {
    const result = await runProbe(cli, args, cwd, 10_000);
    if (result.exitCode === 0) {
      version = parseVersion(result.stdout);
      if (version) break;
    }
  }

  if (!version) {
    warnings.push("Could not detect Graphify version; entering best-effort mode.");
    return { version: null, isSupported: false, warnings };
  }

  const isSupported = isAtLeast(version, MIN_SUPPORTED_GRAPHIFY);
  if (!isSupported) {
    warnings.push(
      `Detected Graphify ${version} is below the supported minimum (${MIN_SUPPORTED_GRAPHIFY}). Some features may be disabled.`,
    );
  }

  return { version, isSupported, warnings };
}

/** Best-effort parse a version string from CLI output. */
export function parseVersion(output: string): string | null {
  // Match semver-like strings such as 2.100.0, 2.100.0-alpha, etc.
  const match = output.match(/(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?)/);
  return match?.[1] ?? null;
}

/** Compare two semver strings. Returns true if `version` >= `minimum`. */
export function isAtLeast(version: string, minimum: string): boolean {
  const v = version.split(".").map(Number);
  const m = minimum.split(".").map(Number);
  for (let i = 0; i < Math.max(v.length, m.length); i++) {
    const a = v[i] ?? 0;
    const b = m[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

/** Build a capability matrix from version and runtime help probes. */
export async function buildCapabilities(
  _cli: string,
  _cwd: string,
  versionInfo: GraphifyVersionInfo,
  runHelp: (args: string[]) => Promise<{ stdout: string; exitCode: number }>,
): Promise<GraphifyCapabilities> {
  const caps: GraphifyCapabilities = {
    build: false,
    query: false,
    path: false,
    explain: false,
    affected: false,
    add: false,
    watch: false,
    reflect: false,
    mcp: false,
    status: false,
    version: false,
    directedGraph: false,
    incrementalUpdate: false,
    semanticExtraction: false,
  };

  // Without a version, we can only safely probe. With a supported version, we
  // still probe because runtime presence is more reliable than version numbers.
  const canProbe = versionInfo.version !== null;
  if (!canProbe) {
    // Best-effort mode: leave everything disabled and let the coordinator warn.
    return caps;
  }

  // Probe each subcommand. A zero exit on `<cmd> --help` means the command exists.
  const commands = [
    "build",
    "query",
    "path",
    "explain",
    "affected",
    "add",
    "watch",
    "reflect",
  ] as const;

  for (const cmd of commands) {
    const result = await runHelp([cmd, "--help"]);
    if (result.exitCode === 0) {
      // Map command existence to capability. Some capabilities share a command.
      if (cmd === "build") {
        caps.build = true;
        caps.status = true;
        caps.incrementalUpdate = helpMentions(result.stdout, "--update");
        caps.directedGraph = helpMentions(result.stdout, "--directed");
      } else {
        caps[cmd] = true;
      }
    }
  }

  // Version is always reported if we can run the binary.
  caps.version = true;

  // MCP support requires both the CLI and the ability to spawn --mcp.
  const mcpHelp = await runHelp(["--mcp", "--help"]).catch(() => ({ stdout: "", exitCode: 1 }));
  caps.mcp = mcpHelp.exitCode === 0 || helpMentions(mcpHelp.stdout, "--mcp");

  // Semantic extraction is inferred from help on build or extract commands.
  caps.semanticExtraction =
    caps.build &&
    helpMentions(
      await runHelp(["build", "--help"])
        .then((r) => r.stdout)
        .catch(() => ""),
      ["--semantic", "--extract"],
    );

  return caps;
}

function helpMentions(help: string, flags: string | string[]): boolean {
  const terms = Array.isArray(flags) ? flags : [flags];
  return terms.some((flag) => help.includes(flag));
}

/** Run a quick probe command. */
function runProbe(
  cli: string,
  args: string[],
  cwd: string,
  timeout: number,
): Promise<{ stdout: string; exitCode: number; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cli, args, { cwd, timeout }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: typeof error.code === "number" ? error.code : 1,
        });
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 });
    });
  });
}
