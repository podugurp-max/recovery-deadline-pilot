# Project 3 Architecture

RecoveryPilot rebuilds DeadlinePilot's mostly-deterministic agent pipeline (Project 2) around a custom tool plus an LLM that makes the final strategy decision.

## Flow

```text
Student input (context + tasks)
        │
        ▼
analyze_student_load  ──► structured workload facts
        │                  (raw hours, adjusted hours, capacity ratios,
        │                   risk flags, per-task risks, recommended mode)
        ▼
computeBaseline       ──► earliest-due-date baseline (for contrast)
        │
        ▼
Gemini recovery agent (src/agents/recoveryAgent.ts)
   - sees tool schema + executed tool output
   - chooses one of SCHEDULE_MODE / RECOVERY_MODE /
     TRIAGE_MODE / WARNING_MODE
   - returns structured submit_strategy_decision call
        │
        ▼
UI renders Strategy / Plan / Risks / First action /
Workload analysis / Baseline comparison / Raw tool trace
```

## What is agentic

- The model **chooses a strategy mode** instead of executing a fixed plan template.
- The model **consumes a tool's structured output** before deciding.
- The model is **constrained by a scheduling guardrail** (planned hours ≤ available hours).
- The model's decision is **compared to a deterministic baseline** so the value-add of the AI is visible.

## What is deterministic

- Workload analysis (`analyze_student_load`) — guarantees consistent ground-truth facts.
- Earliest-due-date baseline — intentionally naive contrast.
- Scheduling-guardrail check in the UI.

This split keeps the AI accountable: facts and overrun-detection are deterministic, judgement is the model's.
