# RecoveryPilot

**AI academic recovery planner for overloaded students.** Turn deadlines, limited time, and stress into a realistic recovery plan.

* **Live app:** https://recovery-deadline-pilot.lovable.app
* **Repository:** https://github.com/podugurp-max/recovery-deadline-pilot

## What it does

RecoveryPilot helps students decide *how* to approach a tight week, not just *what's due first*. It compares the student's workload against available time, energy, and stress, then asks an AI recovery agent to choose one of four strategies:

* **Schedule mode** — enough time; produce a normal schedule.
* **Recovery mode** — somewhat behind; create a focused catch-up plan.
* **Triage mode** — overloaded; prioritize the highest-impact work.
* **Warning mode** — workload is unrealistic; recommend scope reduction or contacting the instructor.

A simple earliest-due-date baseline is shown next to every AI run so the model's decision can be compared against naive sorting.

## How it works

1. The student enters tasks, deadlines, available hours, energy level, and stress level.
2. The custom workload tool, `analyze_student_load`, computes raw work hours, adjusted work hours, capacity ratios, per-task risks, and overall risk flags.
3. Gemini receives the tool's structured output and chooses a strategy mode.
4. The app returns a recovery plan, risk warnings, a first action, and a baseline comparison.
5. The UI flags over-scheduling when planned hours exceed available hours.

## Architecture files

Key implementation files:

* `src/mcp/analyzeStudentLoad.ts` — executes the workload analysis tool.
* `src/mcp/mcpToolDefinitions.ts` — defines the tool name, description, and schema.
* `src/agents/recoveryAgent.ts` — sends structured tool output to Gemini and handles the strategy response.
* `src/types/recovery.ts` — shared types for tasks, context, tool output, and strategy decisions.

## Example scenarios

RecoveryPilot includes three built-in demos:

* **Normal workload** — enough time for a realistic schedule.
* **Messy student input** — vague tasks, blockers, and tight timing.
* **Overload warning case** — more work than available time.

The evaluation details are documented in [`docs/EVALUATION.md`](docs/EVALUATION.md).

## Prompt iteration

The agent prompt evolved from a simple “build a recovery plan” instruction into a tool-grounded prompt that requires a discrete strategy mode, applies a scheduling guardrail, and compares the AI decision against the deterministic baseline.

Both prompt versions and the reasoning behind the changes are documented in [`docs/PROMPT_EVOLUTION.md`](docs/PROMPT_EVOLUTION.md).

## Draft-to-final improvements

After the Project 3 draft, I improved the product framing and documentation based on feedback. The final version has a more student-facing interface, clearer raw versus adjusted workload values, stronger risk-flag logic, local-time date wording, and documented prompt iteration.

The full draft-to-final change log is in [`docs/DRAFT_TO_FINAL_CHANGES.md`](docs/DRAFT_TO_FINAL_CHANGES.md).

## Documentation

* [Prompt evolution](docs/PROMPT_EVOLUTION.md)
* [Draft-to-final changes](docs/DRAFT_TO_FINAL_CHANGES.md)
* [Evaluation scenarios and limitations](docs/EVALUATION.md)
* [Custom workload tool reference](docs/MCP_TOOL.md)
* [Project 3 architecture](docs/PROJECT3_ARCHITECTURE.md)
* [Final write-up](docs/FINAL_WRITEUP.md)

## Tech stack

React · TypeScript · TanStack Start · Gemini via secure server function · Tailwind · shadcn/ui

## Running locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

For local development, create a `.env` file from `.env.example`.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The Gemini key is read server-side only and is not exposed to the browser. The deployed Lovable build uses Lovable Secrets for the key.

## Project history

RecoveryPilot is the Project 3 evolution of DeadlinePilot, my Project 2 academic planning app. DeadlinePilot used a mostly deterministic six-agent planner with an LLM reviewer. RecoveryPilot keeps the academic planning focus but moves the main strategy decision into a Gemini recovery agent grounded in structured workload analysis.
