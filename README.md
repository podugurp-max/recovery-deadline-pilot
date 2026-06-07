# DeadlinePilot

DeadlinePilot is an agentic academic deadline recovery assistant for overwhelmed students. It helps students triage competing assignments, compare required work against available time, identify overload, and create a realistic recovery plan.

## Live App

https://deadline-pilot.lovable.app

## Final Project Repository

https://github.com/podugurp-max/deadline-pilot

## Project 2 Focus

Project 2 focuses on agentic systems: AI applications that can take actions, use tools, and operate with greater autonomy. DeadlinePilot demonstrates this through an orchestrator-style workflow with specialized agents:

- Task Parser Agent
- Priority Agent
- Feasibility Agent
- Schedule Builder Agent
- Risk Agent
- Reviewer Agent

The system does not simply generate a generic schedule. It analyzes the student's workload, scores task priority, checks feasibility, flags risks, and produces a recovery plan.

## Problem

Students often face multiple deadlines at the same time while balancing work, class, personal responsibilities, low energy, and stress. Generic planning tools often assume everything can be completed if time blocks are packed tightly. This can create unrealistic plans and false reassurance.

## Solution

DeadlinePilot creates a recovery plan by using a structured agentic workflow:

1. The user enters available time, energy level, stress level, fixed commitments, and assignments.
2. The Task Parser Agent normalizes assignment data.
3. The Priority Agent ranks tasks by urgency, importance, progress, and difficulty.
4. The Feasibility Agent compares required work against available time.
5. The Schedule Builder Agent creates a plan.
6. The Risk Agent flags overload, low energy, missing information, or deadline risk.
7. The Reviewer Agent checks whether the plan is realistic before approval.

## Current Working Draft

The current draft includes:

- Lovable-generated React app code
- Student context form
- Assignment input section
- Add Assignment button
- Run Recovery Plan button
- Deterministic feasibility scoring
- Priority ranking
- Recommended recovery plan
- Risk warnings
- Missing information section
- Reviewer check
- Visible agent workflow trace
- Evaluation demo buttons for three synthetic test cases
- Markdown documentation for the agentic system design
- Real Gemini-powered Reviewer Agent
- LLM Reviewer Agent Output section
- Secure server-side Gemini API call
- Raw hours vs difficulty-adjusted hours display
- Needs Clarification status for incomplete inputs

## Final LLM Integration Update

Based on draft feedback, DeadlinePilot now includes one real LLM-powered agent step. The deterministic workflow remains as a scaffold for task parsing, priority scoring, feasibility analysis, schedule building, and risk detection. The Reviewer Agent now calls a real Gemini model through a secure server-side API function.

The Gemini Reviewer Agent receives the deterministic recovery plan and audits it for realism, missing information, false reassurance, overload handling, and whether the plan should be approved or marked as needing revision.

This update addresses the main draft feedback: the previous version simulated all six agents deterministically, while the final version includes a real model call in the Reviewer Agent.

## Core Guardrail

The main guardrail is that DeadlinePilot should not provide false reassurance. If the required work exceeds available time, the system should classify the situation as overloaded and create a triage plan instead of pretending everything can be completed.

## Evaluation Cases

The draft includes three synthetic evaluation scenarios:

1. **Normal Workload Test**  
   Expected result: manageable status and reviewer approval.

2. **Messy Input Test**  
   Expected result: missing information is flagged and reviewer asks for revision.

3. **Overload Failure Test**  
   Expected result: overloaded status, risk warnings, and a triage plan instead of false reassurance.

## Final Improvements After Draft Feedback

The draft version had two main issues: all six agents were deterministic, and the messy input test exposed weak handling of incomplete assignment data.

For the final version, the Reviewer Agent now calls Gemini for a live model-based review. The deterministic scaffold was also refined based on Gemini Reviewer feedback. The final version now separates raw estimated hours from difficulty-adjusted hours, uses raw hours for schedule allocation, avoids over-scheduling tasks, flags incomplete inputs as Needs Clarification, and preserves overload triage behavior.

## Tech Stack

- Front end: Lovable-generated React app
- Language: TypeScript
- Styling: CSS / Lovable-generated UI
- Logic: Deterministic JavaScript/TypeScript workflow simulation
- Documentation: Markdown
- Version control: GitHub
- Deployment: Lovable

## Repository Structure

```text
deadline-pilot/
├── .lovable/
├── public/
├── src/
├── .agents/
├── .skills/
├── prompts/
├── test-cases/
├── README.md
├── architecture.md
├── build-log.md
├── development-checklist.md
├── domain-primer.md
├── evaluation.md
├── feedback-log.md
├── personas.md
├── prd.md
└── synthetic-data-strategy.md
