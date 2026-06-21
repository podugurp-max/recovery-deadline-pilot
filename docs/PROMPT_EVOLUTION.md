# Prompt Evolution

This document captures how the RecoveryPilot agent prompt evolved between the draft and final submissions. The final rubric requires at least two documented prompt versions with explicit rationale for what changed.

## Version 1 — Basic recovery planner prompt (draft)

Used in the early draft, before the custom MCP-style tool existed.

```
You are RecoveryPilot, an academic planner.
The student will give you a list of tasks with due dates,
estimated hours, importance, and difficulty.
Build a recovery plan that helps them finish on time.
Output a JSON object with: reasoning, plan (steps), warnings.
```

Behavior:

- Gemini received raw task data only.
- No structured workload analysis.
- Always tried to produce a "complete" plan, even when work clearly exceeded available time.
- No explicit strategy mode — the model implicitly assumed everything could be scheduled.
- No comparison to a deterministic baseline.

Problems observed:

- False reassurance: model produced confident schedules even when capacity was 2× available time.
- No risk surfacing: blocker words in task notes were ignored.
- No agentic decision: model just sorted and scheduled, never decided whether scheduling was appropriate at all.
- Output mentioned UTC and ISO timestamps in user-facing text.

## Version 2 — Tool-assisted recovery agent prompt (final)

Used in the final submission. The full system prompt lives in `src/agents/recoveryAgent.ts`.

Key elements added:

- Tells Gemini that the custom `analyze_student_load` MCP-style tool **has already been executed**, and includes both the tool schema and the executed structured output (totalRawHours, adjustedWorkHours, availableHours, capacityRatioRaw, riskFlags, taskRisks, soonestDueLabel, recommendedMode).
- Requires Gemini to autonomously choose one of four strategy modes: `SCHEDULE_MODE`, `RECOVERY_MODE`, `TRIAGE_MODE`, `WARNING_MODE`.
- Adds a hard "refuse false reassurance" rule when `capacityRatioRaw > 1.0`.
- Adds a **scheduling guardrail**: the sum of `durationHours` in `recoveryPlan` must not exceed `availableHours`; overflow goes into a `notScheduled` array.
- Forces a meaningful `baselineComparison` against the deterministic earliest-due-date baseline.
- Tells Gemini to use the human-friendly `soonestDueLabel` and never mention UTC.
- Forces Gemini to respond via the `submit_strategy_decision` function call (structured output, validated server-side).

### What changed and why

| Change | Why it improved the project |
| --- | --- |
| Inject MCP tool schema + executed output | Grounds the LLM in deterministic facts; the model stops hallucinating workload numbers. |
| Require one of four strategy modes | Makes the model's decision discrete, evaluable, and visible to the user. |
| Hard scheduling guardrail | Stops the model from inventing schedules that don't physically fit. |
| `notScheduled` overflow array | Surfaces hard tradeoffs honestly instead of cramming. |
| Force `baselineComparison` | Makes the AI's value beyond simple due-date sorting auditable. |
| Local-time `soonestDueLabel` | Eliminates UTC/ISO leaks in user-facing copy. |
| Forced function call (`submit_strategy_decision`) | Replaces brittle JSON parsing with constrained, typed output. |

### How V2 supports agentic behavior

- The model **chooses** a mode rather than executing a fixed plan template.
- The model **uses a tool** (the `analyze_student_load` output is explicitly available).
- The model is **accountable**: its decision is compared side-by-side with a deterministic baseline, and over-scheduling is detected and flagged in the UI.
