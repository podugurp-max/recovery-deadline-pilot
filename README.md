# RecoveryPilot

**AI academic recovery planner for overloaded students.** Turn deadlines, limited time, and stress into a realistic recovery plan.

- **Live app:** https://recovery-deadline-pilot.lovable.app
- **Repository:** https://github.com/podugurp-max/recovery-deadline-pilot

## What it does

RecoveryPilot helps students decide *how* to approach a tight week, not just *what's due first*. It analyzes the realistic workload against available time, energy, and stress, then asks an AI agent to choose one of four strategies:

- **Schedule mode** — enough time; produce a normal schedule.
- **Recovery mode** — somewhat behind; focused catch-up plan.
- **Triage mode** — overloaded; prioritize highest-impact work.
- **Warning mode** — workload is unrealistic; recommend scope reduction or contacting the instructor.

A simple earliest-due-date baseline is shown next to every AI run so the model's value beyond naive sorting is visible.

## How it works

1. Enter tasks, deadlines, available hours, energy, and stress level.
2. A custom workload tool (`analyze_student_load`) computes raw and adjusted work hours, capacity ratios, per-task risks, and risk flags.
3. Gemini receives the tool's structured output and autonomously picks a strategy mode, returning a recovery plan, risk warnings, and a first action.
4. The UI also flags over-scheduling (planned hours > available hours) so the AI cannot quietly cram an unrealistic plan.

## Example scenarios

Three built-in demos exercise the agent end-to-end: **Normal workload**, **Messy student input**, and **Overload warning case**. See `docs/EVALUATION.md`.

## Prompt iteration

The agent prompt evolved from a simple "build a recovery plan" instruction into a tool-grounded prompt that forces a discrete strategy mode, enforces a scheduling guardrail, and requires comparison against the deterministic baseline. Both versions and the rationale are in `docs/PROMPT_EVOLUTION.md`.

## Draft-to-final improvements

Notable changes from the Project 3 draft: a real student-facing hero (no class-project framing in the main flow), clearer raw vs adjusted hours, stronger risk-flag logic including blocker keywords, a scheduling guardrail, local-time date wording, and full documentation of prompt iteration. See `docs/DRAFT_TO_FINAL_CHANGES.md`.

## Documentation

- [Prompt evolution](docs/PROMPT_EVOLUTION.md)
- [Draft-to-final changes](docs/DRAFT_TO_FINAL_CHANGES.md)
- [Evaluation scenarios and limitations](docs/EVALUATION.md)
- [Custom MCP-style tool reference](docs/MCP_TOOL.md)
- [Project 3 architecture](docs/PROJECT3_ARCHITECTURE.md)
- [Final write-up](docs/FINAL_WRITEUP.md)

## Tech stack

React · TypeScript · TanStack Start · Gemini (via secure server function) · Tailwind · shadcn/ui

## Running locally

```bash
npm install
npm run dev
```

For local development create a `.env` from `.env.example`. The `GEMINI_API_KEY` is read server-side only; it is never exposed to the browser. The deployed Lovable build uses Lovable Secrets for the key.

## Project history

RecoveryPilot is the Project 3 evolution of DeadlinePilot (Project 2). DeadlinePilot was a mostly-deterministic six-agent planner. RecoveryPilot keeps that scaffold's spirit but moves the actual strategy decision into a Gemini agent grounded in a custom tool's structured output.
