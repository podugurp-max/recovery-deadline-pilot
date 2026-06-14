# RecoveryPilot: AI Academic Recovery Agent

RecoveryPilot is an AI-powered academic recovery planner for students who are overwhelmed by deadlines, limited time, low energy, and competing priorities.

Instead of only sorting assignments by due date, RecoveryPilot analyzes the student’s workload and asks an LLM-powered recovery agent to choose the most realistic strategy: a normal schedule, a recovery plan, a triage plan, or an overload warning.

## Deployed App

https://recovery-deadline-pilot.lovable.app

## Overview

Students often have several assignments due at once, but a simple to-do list does not show whether the workload is actually realistic. RecoveryPilot helps students understand:

* how much work they have left
* how much time they realistically have available
* which tasks are most urgent or risky
* whether a normal schedule is enough
* whether they need triage, scope reduction, or outreach

The app is designed to support realistic academic recovery planning instead of pretending every workload can fit into the available time.

## Key Features

* Student context input for available hours, energy level, stress level, and fixed commitments
* Academic task tracking with due dates, estimated hours, progress, importance, difficulty, and notes
* Custom workload analysis tool: `analyze_student_load`
* Gemini-powered recovery agent
* Strategy selection across four modes:

  * `SCHEDULE_MODE`
  * `RECOVERY_MODE`
  * `TRIAGE_MODE`
  * `WARNING_MODE`
* Deterministic baseline comparison using earliest due date
* Built-in demo scenarios for normal, messy, and overloaded workloads
* Visible tool trace showing how the workload analysis was passed into the AI agent

## How It Works

RecoveryPilot follows a structured agent workflow:

1. The student enters academic workload and personal context.
2. The app runs a custom MCP-style workload analysis tool called `analyze_student_load`.
3. The tool returns structured workload data such as total work hours, available time, capacity ratio, high-risk task count, risk flags, and recommended mode.
4. The structured tool output is passed into the Gemini recovery agent.
5. The LLM chooses a final recovery strategy and explains its reasoning.
6. The app compares the LLM’s decision against a simple deterministic due-date baseline.

## Custom Workload Tool

The custom tool is called:

```text
analyze_student_load
```

It analyzes:

* estimated hours remaining
* available hours
* task due dates
* progress percentage
* task importance
* task difficulty
* energy level
* stress level
* fixed commitments

The tool returns structured workload information that is used by the recovery agent.

Tool logic:

```text
src/mcp/analyzeStudentLoad.ts
```

Tool schema:

```text
src/mcp/mcpToolDefinitions.ts
```

Recovery agent wiring:

```text
src/agents/recoveryAgent.ts
```

## LLM Strategy Decision

The Gemini-powered recovery agent chooses one of four modes:

### `SCHEDULE_MODE`

The workload appears manageable, so the student receives a normal schedule.

### `RECOVERY_MODE`

The workload is tight or messy, but still recoverable with focused prioritization.

### `TRIAGE_MODE`

The student cannot complete everything normally, so the agent prioritizes the highest-impact work.

### `WARNING_MODE`

The workload is unrealistic, and the student should consider scope reduction, partial completion, or contacting the instructor.

## Deterministic Baseline Comparison

RecoveryPilot includes a simple baseline that prioritizes the task with the earliest due date.

This baseline is intentionally limited because it ignores:

* task importance
* progress
* difficulty
* stress
* energy
* blockers
* dependency risks

The app compares the LLM’s decision with this baseline to show how the AI agent goes beyond simple due-date sorting.

## Evaluation Scenarios

RecoveryPilot includes three built-in test scenarios:

### Normal Workload

A manageable workload where the student has enough time to complete the tasks.

Expected behavior:

```text
SCHEDULE_MODE
```

### Messy Student Input

A realistic scenario with vague task notes, blockers, low progress, and tight timing.

Expected behavior:

```text
RECOVERY_MODE
```

### Overload Failure Case

A difficult scenario where work greatly exceeds available time and the student has low energy and high stress.

Expected behavior:

```text
TRIAGE_MODE or WARNING_MODE
```

This case tests whether the agent avoids creating an unrealistic schedule when the workload is not actually possible.

## Project Context

RecoveryPilot was built as an AI 502 Project 3 capstone. It builds on my previous academic planning project, DeadlinePilot, but changes the architecture from a mostly deterministic planner with an LLM reviewer into a tool-assisted AI recovery agent.

The main architectural improvement is that the LLM now receives structured workload analysis from a custom tool and makes the final strategy decision.

## Tech Stack

* React
* TypeScript
* Lovable
* Gemini API
* Custom MCP-style tool schema
* Deterministic baseline comparison

## Running Locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Environment Variables

For local development, create a `.env` file using `.env.example`.

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The deployed Lovable version uses the API key configured in Lovable’s environment/secrets.

## Current Status

This is a working Project 3 draft. The deployed version demonstrates the custom workload tool, Gemini-powered strategy selection, deterministic baseline comparison, and evaluation demos.

Planned final improvements include stronger product polish, clearer raw versus adjusted workload calculations, improved risk flag detection, stronger scheduling guardrails, and cleaner local time formatting.
