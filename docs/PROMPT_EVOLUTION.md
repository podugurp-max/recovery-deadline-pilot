# Prompt Evolution

This document explains how the RecoveryPilot agent prompt evolved during the Project 3 build. The final rubric requires at least two documented prompt versions with a clear explanation of what changed and why.

## Version 1 — Basic recovery planner prompt

Used in the early implementation phase, before the final tool-assisted recovery-agent prompt structure.

```text
You are RecoveryPilot, an academic planner.
The student will give you a list of tasks with due dates,
estimated hours, importance, and difficulty.
Build a recovery plan that helps them finish on time.
Output a JSON object with: reasoning, plan (steps), warnings.
```

Behavior:

* Gemini received the student’s task data, but the prompt did not make the workload analysis central.
* The model focused on producing a plan rather than deciding whether a normal plan was appropriate.
* There was no explicit strategy mode.
* There was no baseline comparison.
* The output could sound complete even when the workload did not realistically fit the student’s available time.

Problems observed:

* The model could produce confident schedules even when the student did not have enough available time.
* Blockers in task notes were not surfaced consistently.
* The decision process was not visible enough.
* User-facing output sometimes included UTC or technical timestamp wording.

## Version 2 — Tool-assisted recovery agent prompt

Used in the final submission. The full system prompt lives in `src/agents/recoveryAgent.ts`.

Key elements added:

* Includes the custom `analyze_student_load` tool schema and the executed workload-analysis output.
* Gives Gemini structured workload evidence such as `totalRawHours`, `adjustedWorkHours`, `availableHours`, `capacityRatioRaw`, `riskFlags`, `taskRisks`, `soonestDueLabel`, and `recommendedMode`.
* Requires Gemini to choose one of four strategy modes: `SCHEDULE_MODE`, `RECOVERY_MODE`, `TRIAGE_MODE`, or `WARNING_MODE`.
* Adds a rule against false reassurance when the workload exceeds available time.
* Adds a scheduling guardrail: planned `durationHours` should not exceed `availableHours`; overflow should go into `notScheduled`.
* Requires a meaningful `baselineComparison` against the deterministic earliest-due-date baseline.
* Tells Gemini to use human-friendly due date labels and avoid UTC in user-facing text.
* Uses structured output through `submit_strategy_decision` so the app can validate and display the result more reliably.

### What changed and why

| Change                                              | Why it improved the project                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Added workload tool schema and executed tool output | Grounds the model in calculated workload facts instead of leaving it to infer everything from raw tasks. |
| Required one strategy mode                          | Makes the model’s decision visible and easier to evaluate.                                               |
| Added scheduling guardrail                          | Reduces unrealistic plans when the workload does not fit the available time.                             |
| Added `notScheduled` overflow                       | Makes tradeoffs visible instead of forcing every task into the plan.                                     |
| Required baseline comparison                        | Shows how the LLM decision differs from simple due-date sorting.                                         |
| Added local-time due labels                         | Keeps the user-facing result cleaner and less technical.                                                 |
| Used structured strategy output                     | Makes the response easier for the app to validate and display.                                           |

### How Version 2 supports agentic behavior

Version 2 makes the model responsible for choosing the recovery strategy. The app provides structured workload evidence, but Gemini decides whether the situation calls for a normal schedule, recovery plan, triage plan, or warning.

That choice is shown beside the deterministic baseline, so the model’s decision can be inspected instead of hidden inside a paragraph.


# Prompt Evolution

This document captures how the RecoveryPilot agent prompt evolved between the draft and final submissions. The final rubric requires at least two documented prompt versions with explicit rationale for what changed.

## Version 1 — Basic recovery planner prompt (draft)

Used in the early draft, before the final tool-assisted prompt structure.

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
- The model receives the executed tool output as structured context and makes the final strategy decision from that evidence.
- The model is **accountable**: its decision is compared side-by-side with a deterministic baseline, and over-scheduling is detected and flagged in the UI.
