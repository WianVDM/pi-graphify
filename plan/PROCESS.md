# Planning Process

This document defines how we plan and track work for `pi-graphify`. It exists so every phase follows the same rhythm, and so a fresh session can pick up context quickly.

## Relationship to other documents

| Document | Purpose |
| --- | --- |
| [DESIGN.md](../docs/DESIGN.md) | High-level vision, principles, feature surface, and success criteria. Rarely changes. |
| [ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Component design and interfaces. Changes when architecture changes. |
| [PLAN.md](PLAN.md) | Master implementation index. Updated every session. |
| `phase-NN-*.md` | Per-phase planning detail. Filled in through iterative passes. |
| This file | The rules for how we create and maintain the plan. |

`DESIGN.md` tells us **what** we want to build. The `plan/` documents tell us **how** we will build it, phase by phase.

## Vertical-slice passes

Each phase file is filled in through multiple passes. Every pass adds detail to **all** phases, or deep-dives the active phase. This keeps the overall roadmap stable while letting details emerge.

### Pass 1 — Skeleton

For every phase:

- One-sentence goal
- 5–7 in-scope bullets
- 3–5 out-of-scope bullets
- Key deliverables
- Verifiable completion criteria

### Pass 2 — Dependencies and risks

For every phase:

- Dependencies on earlier phases
- Risks that could change scope
- Testing notes
- Decisions made (if any)

### Pass 3 — Task breakdown

For the upcoming phase(s):

- Concrete task list
- Each task is a verifiable outcome
- No subtasks yet

### Pass 4 — Deep-dive active phase

Only the phase we are about to implement:

- Task → subtask breakdown
- File-by-file implementation notes
- Resolved decisions
- Acceptance criteria per task

Future phases stay at the highest pass they need until they become active.

## Phase document template

Every phase file should use this order:

```markdown
# Phase N — Title

**Status:** [emoji] Status  
**Plan pass:** N

## Goal

## In scope

## Out of scope

## Key deliverables

## Task breakdown

## Completion criteria

## Decisions

## Dependencies

## Risks

## Testing notes

## Notes
```

- Use `## Decisions` only after there are decisions to record.
- Use `## Task breakdown` only when the phase has reached Pass 3 or 4.

## Decision tracking

When a design question affects implementation, record it in the active phase file under `## Decisions`.

Each decision entry includes:

- What was decided
- Why
- Alternatives considered

This prevents re-litigating choices in later sessions and makes the rationale visible.

## Session workflow

At the **start** of every session:

1. Open `PLAN.md`.
2. Read the **Current status** block.
3. Open the active phase document.
4. Update `PLAN.md` **Last updated** if anything changes.

At the **end** of every session:

1. Update the active phase task checkboxes.
2. Update `PLAN.md` **Current status** (active phase, next action, blockers).
3. Note any decisions or risks discovered.

## When to move from planning to implementation

A phase is ready to implement when:

- Its open questions are resolved and recorded as decisions.
- Its task breakdown is detailed enough that the next action is unambiguous.
- Completion criteria are verifiable.
- The user explicitly approves implementation.

We do not implement during planning or brainstorming without explicit approval.

## Committing plan changes

Plan changes are committed with a `docs(plan):` conventional commit when they represent a coherent update, such as:

- Completing a planning pass across phases
- Resolving major open questions
- Deep-diving an active phase

Small session updates can be batched or committed at the end of the phase.
