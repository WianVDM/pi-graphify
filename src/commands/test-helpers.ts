/**
 * Shared test helpers for command tests.
 */

import { createMockBackend } from "../backends/mock.js";
import { GraphifyCoordinator } from "../coordinator.js";

export function createTestCoordinator(backend = createMockBackend()): GraphifyCoordinator {
  return new GraphifyCoordinator({ cwd: process.cwd(), backend });
}

export function getCoordinator(
  coordinator: GraphifyCoordinator | null,
): () => GraphifyCoordinator | null {
  return () => coordinator;
}
