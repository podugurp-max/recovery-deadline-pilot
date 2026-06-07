# Build Log

## V1: Project Concept

### Goal

Define a Project 2 idea that clearly demonstrates agentic behavior.

### Decision

I selected DeadlinePilot, an academic deadline recovery assistant for overwhelmed students.

### Reason

This project shows agentic behavior more clearly than a simple chatbot because it parses tasks, scores priority, checks feasibility, builds a plan, flags risks, and reviews the final output.

## V2: Initial Lovable Prototype

### Goal

Create a working app draft with the main student input and recovery plan sections.

### Implemented

- Header
- Student context form
- Assignment input section
- Add Assignment button
- Run Recovery Plan button
- Output dashboard
- Feasibility status
- Priority ranking
- Recovery plan
- Risk warnings
- Reviewer check

### Prompt Used

The initial Lovable prompt asked for a React app called DeadlinePilot with deterministic JavaScript logic for feasibility scoring and triage behavior.

## V3: Agentic Workflow and Evaluation Demo

### Goal

Make the app clearly match the Project 2 agentic-system focus.

### Implemented

- About the Agentic Workflow section
- Task Parser Agent
- Priority Agent
- Feasibility Agent
- Schedule Builder Agent
- Risk Agent
- Reviewer Agent
- Evaluation Demo buttons
- Normal Workload Test
- Messy Input Test
- Overload Failure Test

### Prompt Used

The second Lovable prompt added the orchestrator-style workflow explanation and synthetic test case loaders.

## V4: Draft Evaluation

### Goal

Test the current working draft across normal, messy, and overloaded student workload scenarios.

### Results

- Test 1 passed. The normal workload was classified as manageable and received reviewer approval.
- Test 2 partially passed. The system detected missing information, but it still handled the incomplete input too confidently.
- Test 3 passed. The overload case was classified as overloaded, and the system created a triage plan instead of giving false reassurance.

## Known Issue

The messy input test exposed a current failure mode. Missing or incomplete task fields need stronger handling. The next version should add a “Needs Clarification” status and prevent the system from labeling incomplete plans too confidently.

## Next Iteration

Planned improvements:

- Improve missing due date display.
- Add provisional status for incomplete data.
- Strengthen Reviewer Agent logic.
- Improve priority scoring explanation.
- Add clearer raw hours vs difficulty-adjusted hours display.
- Consider connecting the agent workflow to a live LLM API after deterministic guardrails are stable.

## V5: Gemini Reviewer Agent Integration

### Goal

Address draft feedback that the six agents were deterministic functions and no LLM was called.

### Change

Kept the deterministic scaffold for task parsing, priority ranking, feasibility scoring, scheduling, and risk detection. Upgraded the Reviewer Agent so it calls a real Gemini model through a secure server-side API function.

### Result

DeadlinePilot now includes a real Gemini-powered Reviewer Agent. The Reviewer Agent audits the deterministic recovery plan for realism, missing information, false reassurance, overload handling, and whether the output should be approved or marked as needing revision.

### Evidence

In the final evaluation scenarios, the app displayed Gemini Reviewer output and the agent workflow trace stated that the Reviewer Agent called a live Gemini model.

## V6: Deterministic Scaffold Refinement

### Goal

Improve the deterministic scaffold based on Gemini Reviewer feedback while preserving the real Gemini Reviewer Agent integration.

### Changes

- Clarified raw estimated hours vs difficulty-adjusted hours.
- Changed “weighted work” wording to “difficulty-adjusted work.”
- Updated schedule blocks to use raw hours remaining instead of adjusted hours.
- Removed confusing missing-date behavior such as “9999.0h.”
- Added Needs Clarification status for incomplete or invalid input.
- Added incomplete/invalid task handling.
- Added risk warning for 0 hours remaining with 0% progress.
- Improved priority explanations when grade weight outweighs earlier due date.

### Result

The system now handles the three evaluation scenarios more reliably. Normal workload scheduling no longer over-allocates time, messy input is classified as Needs Clarification, and overload still produces triage rather than false reassurance. The Gemini Reviewer Agent remains active and audits the deterministic output.
