# Evaluation

Three scenarios are wired into the UI as "Try example scenarios" buttons. Each is designed to stress a different part of the agent.

## Scenario 1 — Normal workload

**Input summary:** 2 small tasks (reading response, problem set), ~3.5h of work, 9h available across today + tomorrow. Energy high, stress low.

- **Expected strategy:** `SCHEDULE_MODE`
- **Observed (latest run):** `SCHEDULE_MODE` — Gemini produces a calm 2–3 step plan and confirms there is buffer time.
- **What good looks like:** plan steps total ≤ available hours, no urgent risk warnings, baseline pick and AI pick largely agree.
- **What still needs improvement:** when both tasks are easy, the LLM sometimes produces overly verbose reasoning.

## Scenario 2 — Messy student input

**Input summary:** vague task names ("Essay thing"), blocker-word notes ("Thesis unclear", "teammates haven't responded", "Forgot which experiment"), tight 20–40h deadlines.

- **Expected strategy:** `RECOVERY_MODE`
- **Observed (latest run):** `RECOVERY_MODE` — task-level risks now correctly flag blocker words, and risk warnings call out the unclear thesis and unresponsive teammates.
- **What good looks like:** risk flags surface blocker words, plan starts with the most blocked/important task, `firstAction` includes a concrete clarification step.
- **What still needs improvement:** the model occasionally schedules the lab notebook before clarifying blockers on the essay; future work would weight blocker tasks higher.

## Scenario 3 — Overload warning case

**Input summary:** 4 hard high-importance tasks totaling ~22h of work, 5h available. Energy low, stress high.

- **Expected strategy:** `TRIAGE_MODE` or `WARNING_MODE`
- **Observed (latest run):** `WARNING_MODE` — Gemini refuses to produce a complete schedule, recommends partial completion plus instructor outreach, and uses the `notScheduled` field for overflow.
- **What good looks like:** planned hours ≤ available hours, overflow appears in "Not scheduled yet", and the UI does NOT flag over-scheduling.
- **What still needs improvement:** earlier runs sometimes returned `TRIAGE_MODE` with subtly over-scheduled plans; the new scheduling guardrail and UI warning catch this when it happens.

## Documented limitations

1. The model can still produce a plan that sounds too complete when workload is near capacity (~0.9–1.1×). The over-scheduling check helps, but qualitative confidence is harder to bound.
2. Risk flag quality depends on the wording of student notes — terse notes produce fewer flags.
3. Time estimates are user-provided. A wrong estimate (e.g. "1h" for a 6h paper) propagates through the entire plan.
4. The deterministic baseline is intentionally naive (earliest due date). It exists for contrast, not as a competitive planner.
