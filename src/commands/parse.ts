/**
 * Shared argument parsing utilities for Graphify slash commands.
 */

const WHITESPACE = /\s+/;

/** Split an argument string on whitespace while respecting single and double quotes. */
export function splitArgs(args: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  function flushToken() {
    if (current === "") return;
    tokens.push(current);
    current = "";
  }

  for (const char of args) {
    if (quote && char === quote) {
      quote = null;
      continue;
    }
    if (quote) {
      current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (WHITESPACE.test(char)) {
      flushToken();
      continue;
    }
    current += char;
  }

  flushToken();
  if (quote !== null) {
    tokens.push(current);
  }

  return tokens;
}

export interface ParseBooleanFlagResult {
  value: boolean | undefined;
  rest: string[];
}

/**
 * Detect `--flag` or `--flag=true|false` in a token list.
 * Returns the flag value and the remaining tokens with the flag removed.
 */
export function parseBooleanFlag(
  tokens: string[],
  flag: string,
  supportsValue: boolean = false,
): ParseBooleanFlagResult {
  const prefix = `--${flag}`;
  const valuePrefix = `${prefix}=`;
  let value: boolean | undefined;
  const rest: string[] = [];

  for (const token of tokens) {
    if (token === prefix) {
      value = true;
      continue;
    }

    if (supportsValue && token.startsWith(valuePrefix)) {
      value = parseFlagValue(token.slice(valuePrefix.length), flag);
      continue;
    }

    rest.push(token);
  }

  return { value, rest };
}

function parseFlagValue(raw: string, flag: string): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new FlagValueError(flag, raw);
}

class FlagValueError extends Error {
  readonly flag: string;
  readonly value: string;

  constructor(flag: string, value: string) {
    super(`Invalid value for --${flag}: ${value}`);
    this.flag = flag;
    this.value = value;
  }
}

/** Build a usage message for a command. */
export function usageError(command: string, usage: string): Error {
  return new Error(`Usage: /${command} ${usage}`);
}
