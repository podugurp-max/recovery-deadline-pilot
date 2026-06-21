# RecoveryPilot — Final Write-up

## What it solves and who it's for

RecoveryPilot is for college students who are overloaded — multiple deadlines stacking up, limited hours, low energy, and rising stress. A normal to-do list sorts by due date and hides the harder truth: sometimes everything simply does not fit. RecoveryPilot is built to be honest about that. It tells students whether they can realistically schedule everything, whether they need a focused recovery plan, whether they need to triage, or whether the workload is unrealistic enough that they should consider scope reduction or talking to an instructor.

## System architecture

The app combines a deterministic workload analyzer with a Gemini-powered agent.

1. **Workload analyzer (`analyze_student_load`).** A custom MCP-style tool defined with a name, description, and input/output schema. Given the student's context and task list, it computes raw and difficulty-adjusted hours, capacity ratios, per-task risks, and a recommended (non-final) mode.
2. **Deterministic baseline.** A naive earliest-due-date pick, used purely for contrast.
3. **Gemini recovery agent.** Receives the tool schema, the executed tool output, and the baseline result. Autonomously chooses one of four strategy modes (`SCHEDULE_MODE` / `RECOVERY_MODE` / `TRIAGE_MODE` / `WARNING_MODE`) and returns a structured `submit_strategy_decision` function call.
4. **UI.** Renders the chosen strategy, plan, risk warnings, first action, workload analysis, baseline comparison, and the raw tool trace for transparency.

If Gemini is unreachable, a clearly-labeled fallback mode runs using the tool's recommended mode. The badge in the strategy card always tells the user whether they're seeing live AI or fallback.

## What is agentic about it

The model isn't pattern-matching to a fixed plan template. It:

- Consumes a tool's structured output before deciding.
- Picks one of four discrete strategy modes.
- Is allowed to override the tool's recommended mode, but must explain why.
- Is bound by a scheduling guardrail (planned hours must not exceed available hours; overflow goes into `notScheduled`).
- Is forced to explain how its decision compares to the deterministic baseline.

## How it was evaluated

Three scenarios are built into the UI: **Normal workload**, **Messy student input**, and **Overload warning case**. Each one stresses a different failure mode (false-completeness in normal cases, blocker detection in messy cases, refusal of false reassurance in overload cases). Details and observed behavior are in `docs/EVALUATION.md`. The over-scheduling check in the UI catches the most common quantitative failure mode.

## What changed from draft based on feedback

The draft already had the custom tool + LLM decision architecture, and that part was praised. The final pass focused on:

- Replacing the project-y hero and "Project 3 evidence" panels with a real product hero and a "How it works" 3-step section.
- Moving all class-project evidence into a collapsible Technical Evidence section.
- Separating raw and adjusted hours cleanly in both the tool output and the UI.
- Strengthening risk detection (blocker words, capacity buckets, per-task urgency).
- Adding a hard scheduling guardrail and an explicit "this plan exceeds available time" warning.
- Removing UTC from user-facing copy.
- Documenting two distinct prompt versions in `docs/PROMPT_EVOLUTION.md`.
- Adding `docs/DRAFT_TO_FINAL_CHANGES.md` so the diff is auditable.

## What breaks or would be fixed with more time

- Borderline-capacity cases (0.9–1.1×) can still produce plans that *sound* complete; quantitative over-scheduling is caught, qualitative over-confidence is harder to bound.
- Risk flag coverage depends on the wording of student notes.
- Time estimates are user-provided; a bad estimate poisons the plan.
- A real external MCP server (rather than an in-codebase MCP-style tool schema) would require hosting and is out of scope.
