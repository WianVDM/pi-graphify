# Ecosystem Integration Document: pi-graphify

`pi-graphify` is designed to live in a Pi session alongside other extensions. **Direct third-party integrations are not the main focus of the initial implementation**, but the architecture is intentionally open so that integrations can be added later by us or by other extension authors.

This document explains the design philosophy and the integration points that are planned for the future. For the technical hook design, see `docs/ARCHITECTURE.md`.

---

## Core philosophy

- **Do not duplicate.** If another extension already solves a problem, `pi-graphify` should interoperate with it rather than reimplement.
- **Add project context.** Graphify’s unique value is structural knowledge of the current project. It should feed that context into the agent.
- **Export durable lessons.** When graph queries produce reusable insights, those lessons can be stored in memory extensions.
- **Stay out of the way.** If another extension is better suited for a task, `pi-graphify` should not interfere.

---

## pi-hermes-memory

### Status

This integration is **planned but not part of the initial implementation**. The hook architecture in `docs/ARCHITECTURE.md` makes it straightforward to add later without coupling the core extension to Hermes.

### Relationship

`pi-hermes-memory` stores durable facts, preferences, corrections, failures, and procedural skills across sessions. `pi-graphify` provides structural knowledge of the current project.

They are **complementary**.

### Integration points

1. **Memory entries from graph lessons**
   When a graph query reveals a durable fact (e.g., “The auth flow goes through `AuthMiddleware` → `TokenService` → `UserRepository`), `pi-graphify` can save that as a convention or insight memory if the user confirms it is useful.

2. **Graphify conventions**
   If the user consistently prefers `--directed` graphs or `--mode deep`, Hermes memory can store that preference, and `pi-graphify` can read it from `USER.md` or the `memory_search` tool.

3. **Failure memory**
   If a graph query gives a wrong answer and the user corrects it, the correction can be written to Hermes failure/correction memory so the agent does not repeat the mistake.

### Implementation note

Direct integration with Hermes memory will be optional. If `pi-graphify` detects that Hermes memory tools are available, it can use them. If not, it skips the integration silently.

---

## pi-fallow

### Relationship

`pi-fallow` provides deterministic TypeScript/JavaScript code intelligence: dead code, duplication, complexity, and architecture drift. `pi-graphify` provides project-wide structural knowledge across languages and file types.

They are **complementary** and can coexist in the same session.

### When to use which

| Use case | Best tool |
|---|---|
| “Is this export used?” | Fallow |
| “How does this function relate to files across the repo?” | Graphify |
| “Where is code duplicated?” | Fallow |
| “What is the shortest path from `AuthModule` to `Database`?” | Graphify |
| “Is this component imported correctly?” | Fallow |
| “What communities exist in this codebase?” | Graphify |

### Integration points

1. **Coexistence**
   Both extensions register tools. The agent decides which to use based on the question. `pi-graphify` should not intercept Fallow tool calls or vice versa.

2. **Shared project context**
   If both extensions detect a project, they may both inject context hints. The system prompt should remain coherent. `pi-graphify` will use a clearly delimited `<graphify-context>` block to avoid clashing with Fallow’s hints.

### Implementation note

No direct code coupling. Integration is purely at the agent level: both tools are available, and the agent chooses.

---

## Other memory extensions

Any Pi extension that provides a `memory` or `memory_search` tool can, in principle, receive durable lessons from `pi-graphify`. The integration is generic:

1. Detect if a memory tool is registered.
2. If a graph query produces a lesson, format it as a memory entry.
3. Call the memory tool with the lesson.

This is future work and will be configurable.

---

## Provider and auth extensions

Extensions like `pi-claude-oauth-adapter` or custom provider packages manage how Pi talks to LLMs. `pi-graphify` does not interact with them directly.

However, if the Graphify semantic extraction uses the user’s configured LLM provider (e.g., Gemini), the extension should respect the same environment variables Graphify already uses (`GEMINI_API_KEY`, `GOOGLE_API_KEY`). It should not attempt to read or manage those keys itself.

---

## Project trust extensions

If a Pi extension customizes the project trust flow, `pi-graphify` should respect the final trust decision. Project-local config and auto-watch are only honored when the project is trusted.

---

## Ecosystem behavior rules

1. **Use namespaced tool names.** All tools are `graphify_*` to avoid collisions.
2. **Use namespaced commands.** All commands are `/graphify-*` to avoid collisions.
3. **Do not intercept other extensions.** `pi-graphify` may intercept read/grep only when explicitly enabled and only to suggest graph tools, not block the original tool.
4. **Export, do not import.** `pi-graphify` may write lessons to memory extensions, but it should not read their private state.
5. **Respect user config.** If another extension stores a preference that affects Graphify (e.g., “use directed graphs”), read it through Pi’s normal channels if available.

---

## Future ecosystem integrations

- **Skill extensions:** A Pi skill could teach the agent how to combine Fallow and Graphify for deep code reviews.
- **Prompt template extensions:** A prompt template could provide a pre-canned “Graphify-assisted refactor” workflow.
- **Theme extensions:** Not relevant to `pi-graphify` unless we want a custom TUI theme.

---

## Open questions

1. Should `pi-graphify` explicitly detect `pi-hermes-memory` and offer to write graph lessons into it?
2. Should `pi-graphify` read `USER.md` to discover user preferences like `--directed` graphs?
3. Should there be a shared convention for “project context” blocks so multiple extensions can inject hints without clashing?

These will be answered as we implement and test alongside other extensions.
