/**
 * pi-graphify configuration
 */

export interface GraphifyConfig {
  /** Whether to auto-watch source files and rebuild the graph. */
  autoWatch: boolean;
  /** Debounce window for file watcher events (ms). */
  debounceMs: number;
  /** Timeout for full graph builds (ms). */
  buildTimeoutMs: number;
  /** Timeout for graph queries (ms). */
  queryTimeoutMs: number;
  /** Timeout for short CLI calls like status checks (ms). */
  shortTimeoutMs: number;
}

export function loadConfig(): GraphifyConfig {
  return {
    autoWatch: false,
    debounceMs: 2000,
    buildTimeoutMs: 300_000,
    queryTimeoutMs: 30_000,
    shortTimeoutMs: 10_000,
  };
}
