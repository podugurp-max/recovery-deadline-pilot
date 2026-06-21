# Draft to Final Changes

## Summary of draft feedback

The Project 3 draft was well received. The instructor highlighted that RecoveryPilot is a meaningful architectural step beyond Project 2 (DeadlinePilot) because the deterministic agents were rebuilt around a custom tool plus an LLM that makes the final strategy decision.

## What the instructor praised

- `analyze_student_load` defined with a name, description, and input/output schema in `src/mcp/mcpToolDefinitions.ts`.
- The recovery agent wiring tool output into Gemini.
- The model autonomously selecting among four strategy modes.
- The deterministic baseline comparison making the LLM decision visible.
- Commit history and documentation work.

## Gaps remaining in the draft

- Only one prompt version was documented.
- No explicit "what changed from draft to final" write-up.
- App still read like a class project — architecture notes and "Project 3 evidence" dominated the main flow.
- Raw vs adjusted hours were conflated.
- `riskFlags` was sometimes empty even when task notes contained obvious blockers.
- LLM could output a recovery plan whose total `durationHours` exceeded `availableHours`.
- Some user-facing dates leaked UTC/ISO formatting.

## What changed for the final

### Product polish
- New hero: title, subtitle ("AI academic recovery planner for overloaded students"), supporting line. No more "Project 3 capstone" / "MCP-powered" in the main pitch.
- Replaced the large architecture-notes card with a 3-step "How it works" section.
- Renamed "Evaluation demos" → "Try example scenarios"; restyled the three demo buttons with friendly captions.
- Result sections renamed for students: Strategy chosen / Why this strategy / Your recovery plan / Risk warnings / Do this first / Workload analysis / Baseline comparison.
- Moved all class-project evidence into a collapsible **Technical evidence** section near the bottom.

### Workload analysis (`analyze_student_load`)
- `totalRawHours` is now strictly the sum of user estimates (after progress).
- New `adjustedWorkHours`, `capacityRatioRaw`, `capacityRatioAdjusted`.
- New `taskRisks` array with per-task `urgencyLevel` and reasons.
- New `soonestDueLabel` (local-time friendly string).
- Stronger risk-flag logic: capacity buckets at ≥0.85 / ≥1.0 / ≥1.25 / ≥2.0, plus low energy, high stress, high-importance/hard tasks under 30% progress, due-within-24h / 12h, and blocker words (`unclear`, `blocked`, `waiting`, `teammate`, `forgot`, `failing`, `missing`, `confused`, `need sources`, `not responding`, `stuck`, etc.).

### Recovery agent (`src/agents/recoveryAgent.ts`)
- System prompt rewritten — see `docs/PROMPT_EVOLUTION.md`.
- Hard scheduling guardrail: planned hours must be ≤ available hours; overflow goes into `notScheduled`.
- UI now sums `durationHours` and surfaces "This plan exceeds available time and should be revised." if the LLM still over-schedules.
- Prompt explicitly forbids UTC wording and forces `soonestDueLabel`.

### Documentation
- Added `docs/PROMPT_EVOLUTION.md` with V1 and V2 prompts plus a comparison table.
- Added `docs/DRAFT_TO_FINAL_CHANGES.md` (this file).
- Added `docs/EVALUATION.md`, `docs/MCP_TOOL.md`, `docs/PROJECT3_ARCHITECTURE.md`, `docs/FINAL_WRITEUP.md`.
- README updated with Prompt Iteration, Draft-to-Final Improvements, and Documentation sections.

## What still breaks or would be fixed with more time

- The LLM can still occasionally produce a plan that *sounds* complete when capacity is right at 1.0×. The UI flags over-scheduling, but qualitative over-confidence is harder to catch.
- Risk flag quality depends on the wording of student notes. A richer NLP pass would help.
- Hours are entirely user-estimated; bad estimates still produce bad plans.
- A true external MCP server (versus a custom MCP-style tool schema) would require a hosted MCP endpoint and is out of scope.
