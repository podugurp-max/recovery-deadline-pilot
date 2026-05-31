# Evaluation Plan

## Evaluation Goal

The goal of evaluation is to test whether DeadlinePilot behaves like an agentic recovery planner instead of a generic schedule generator.

The system should not only succeed on easy inputs. It should also expose and document failure modes, especially when the student's workload is incomplete, messy, or impossible.

## Evaluation Metrics

| Metric | Description | Pass Condition |
|---|---|---|
| Task Parsing | Did the system identify assignments and key fields? | Assignments are visible in the workflow trace |
| Priority Quality | Did the system rank tasks using urgency and importance? | Highest-risk tasks appear near the top |
| Feasibility Accuracy | Did the system compare required hours against available hours? | Correct manageable/tight/overloaded status |
| Risk Detection | Did the system flag overload, low energy, high stress, or missing info? | Risks are shown when present |
| Guardrail Behavior | Did the system avoid false reassurance? | Overloaded cases produce triage, not fake completion |
| Reviewer Behavior | Did the Reviewer Agent approve or request revision? | Reviewer output appears in final result |
| Agent Trace | Is the workflow visible? | Trace shows each specialized agent |

## Test Case 1: Normal Workload

### Purpose

Test whether the system handles a manageable workload correctly.

### Expected Behavior

- Feasibility status should be manageable.
- Recovery plan should fit available time.
- Reviewer Agent should approve.
- No major risk warnings should appear.

### Draft Result

Status: Passed.

The system classified the workload as manageable, created a recovery plan, and displayed the agent workflow trace.

## Test Case 2: Messy Input

### Purpose

Test whether the system can handle vague or incomplete assignment data.

### Expected Behavior

- Missing information should be flagged.
- The system should avoid inventing missing details.
- Reviewer Agent should mark the plan as needing revision.
- The system should not be overly confident when required fields are missing.

### Draft Result

Status: Partial pass; known limitation.

The system detected missing information and the Reviewer Agent marked the output as needing revision. However, the current draft still treats the situation too confidently in some places. For example, missing due dates need clearer handling, and incomplete tasks should trigger a stronger provisional or needs-clarification status.

This failure is useful because it shows where the next iteration should improve.

## Test Case 3: Overload Failure Case

### Purpose

Test the most important guardrail: whether the system refuses false reassurance when the workload is impossible.

### Expected Behavior

- Feasibility status should be overloaded.
- The system should not claim everything can be finished.
- The system should create a triage plan.
- Risk warnings should appear.
- Reviewer Agent should approve only if false reassurance is avoided.

### Draft Result

Status: Passed.

The system correctly classified the workload as overloaded, warned that completing everything was not realistic, and created a triage plan. This directly supports the Project 2 goal of testing agentic behavior and avoiding easy-only evaluation cases.

## Known Limitation

The current draft uses deterministic JavaScript logic instead of live LLM calls. This is intentional for the working draft because it allows the workflow, scoring logic, and guardrails to be tested clearly.

The biggest known issue is messy-input handling. Future revisions should:

- replace awkward missing-date displays with “Due date missing”
- add a “Needs Clarification” status
- treat incomplete tasks as provisional
- strengthen reviewer rejection logic for missing information
