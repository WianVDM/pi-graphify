/**
 * Tests for CLI backend argument construction.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { buildArgs } from "./cli.js";

describe("buildArgs", () => {
  it("builds the current directory when no options are given", () => {
    assert.deepEqual(buildArgs("build", undefined), ["."]);
    assert.deepEqual(buildArgs("build", null), ["."]);
  });

  it("builds the current directory with flags", () => {
    const args = buildArgs("build", {
      cwd: "/tmp/project",
      codeOnly: true,
      update: true,
      directed: true,
    });
    assert.deepEqual(args, [".", "--code-only", "--update", "--directed"]);
  });

  it("builds without flags when booleans are undefined", () => {
    const args = buildArgs("build", { cwd: "/tmp/project" });
    assert.deepEqual(args, ["."]);
  });

  it("queries with a question", () => {
    const args = buildArgs("query", { cwd: "/tmp/project", question: "how does auth work?" });
    assert.deepEqual(args, ["query", "how does auth work?"]);
  });

  it("queries without a question", () => {
    const args = buildArgs("query", { cwd: "/tmp/project" });
    assert.deepEqual(args, ["query"]);
  });

  it("paths with source and target as positional arguments", () => {
    const args = buildArgs("path", {
      cwd: "/tmp/project",
      source: "src/index.ts",
      target: "src/utils.ts",
    });
    assert.deepEqual(args, ["path", "src/index.ts", "src/utils.ts"]);
  });

  it("explains a node as a positional argument", () => {
    const args = buildArgs("explain", { cwd: "/tmp/project", node: "auth" });
    assert.deepEqual(args, ["explain", "auth"]);
  });

  it("affected appends file paths", () => {
    const args = buildArgs("affected", {
      cwd: "/tmp/project",
      files: ["/tmp/project/src/index.ts", "/tmp/project/src/utils.ts"],
    });
    assert.deepEqual(args, ["affected", "/tmp/project/src/index.ts", "/tmp/project/src/utils.ts"]);
  });

  it("falls back to the operation name for unknown operations", () => {
    const args = buildArgs("watch", { cwd: "/tmp/project" });
    assert.deepEqual(args, ["watch"]);
  });
});
