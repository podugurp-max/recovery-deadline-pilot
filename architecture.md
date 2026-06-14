Architecture
Overview

RecoveryPilot is an academic recovery assistant that helps overwhelmed students decide whether they need a normal schedule, a focused recovery plan, a triage plan, or an overload warning.

The app uses a custom MCP-style tool called analyze_student_load and a Gemini-powered recovery agent.

High-Level Flow
The student enters context and academic tasks.
The app calls the custom MCP-style tool: analyze_student_load.
The tool returns structured workload analysis.
The app builds a recovery-agent prompt containing:
student context
task list
custom tool definition
custom tool output
deterministic baseline result
Gemini chooses one recovery strategy mode.
The app displays:
autonomous strategy decision
model reasoning
recovery plan
risk warnings
what to do first
MCP tool trace
deterministic baseline comparison
Architecture Diagram
Student Input
     |
     v
Student Context + Academic Tasks
     |
     v
Custom MCP-Style Tool
analyze_student_load
     |
     v
Structured Workload Output
     |
     v
Recovery Agent Prompt
(tool definition + tool output + baseline)
     |
     v
Gemini LLM
     |
     v
Strategy Decision
SCHEDULE / RECOVERY / TRIAGE / WARNING
     |
     v
UI Results
plan + risks + baseline comparison + tool trace
Custom Tool Role

The custom tool does not write the final plan. Its job is to analyze workload facts and provide structured context.

The tool calculates:

total estimated workload
available time
capacity ratio
high-risk task count
soonest due date
risk flags
recommended mode

The tool’s recommended mode is not treated as the final answer. It is passed to the LLM as context.

LLM Role

The LLM is responsible for the final strategy decision.

It chooses one of:

SCHEDULE_MODE
RECOVERY_MODE
TRIAGE_MODE
WARNING_MODE

The model explains why it selected that strategy and creates a recovery plan for the student.

Deterministic Baseline

The deterministic baseline uses a simple earliest-due-date rule. It prioritizes whichever task is due first.

This baseline is intentionally limited. It does not consider:

importance
progress
difficulty
energy level
stress level
blockers
dependency risk

The LLM’s strategy is compared to this baseline so the autonomous decision is easier to evaluate.

Agentic Behavior

RecoveryPilot demonstrates agentic behavior because the model is not only summarizing a hardcoded output. It receives structured tool output and makes a strategy decision based on the situation.

The agent decides whether the student needs:

a normal schedule
a recovery plan
a triage plan
an overload warning
Production Quality Direction

The app is designed around a real student problem: academic overload. Instead of assuming every set of tasks can be scheduled, RecoveryPilot can recognize when the workload is unrealistic and recommend triage, scope reduction, or outreach.

Current Draft Notes

The current draft successfully demonstrates the Project 3 architecture, but the final version should improve the user-facing polish. Some class/project evidence is currently visible in the main UI and should eventually be moved into a technical evidence section.
