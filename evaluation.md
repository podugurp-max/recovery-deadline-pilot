Evaluation

RecoveryPilot includes three built-in evaluation demos. These demos are designed to test whether the app can handle manageable, messy, and overloaded academic situations.

Evaluation Case 1: Normal Workload Demo
Purpose

Test whether the system creates a normal schedule when the student has enough time.

Input Summary

The student has a manageable number of tasks and enough available hours to complete them.

Expected Behavior

The LLM should choose:

SCHEDULE_MODE
What This Tests
basic workload analysis
successful tool output
normal planning behavior
LLM strategy selection
Success Criteria

The app should:

run the custom tool
display the tool trace
choose SCHEDULE_MODE
generate a realistic schedule
compare the LLM result to the earliest-due-date baseline
Evaluation Case 2: Messy Student Input Demo
Purpose

Test whether the system can handle vague student input, partial progress, blockers, and tight timing.

Input Summary

The student has several tasks with unclear notes, low progress, and possible external dependencies.

Example issues:

unclear thesis
teammates not responding
forgotten lab details
multiple tasks due soon
Expected Behavior

The LLM should choose:

RECOVERY_MODE
Actual Draft Behavior

In testing, the LLM selected:

RECOVERY_MODE

It recognized that the workload was technically close to available time but had almost no buffer. It also identified that the group slides had teammate dependency risk and that the essay had low progress, high difficulty, and unclear thesis risk.

What This Tests
realistic messy input
qualitative blockers
task prioritization beyond due date
LLM reasoning using tool output
comparison against a simple due-date baseline
Success Criteria

The app should:

identify the tight workload
produce a focused recovery plan
prioritize urgent and high-risk work
explain how the LLM strategy differs from the deterministic baseline
Draft Observation

The LLM handled the messy input test well by selecting Recovery Mode and explaining the qualitative task risks. However, the custom tool’s riskFlags array should be strengthened before final submission because some obvious risks were not always reflected in the tool output.

Evaluation Case 3: Overload Failure Demo
Purpose

Test whether the system recognizes when a student has more work than available time.

Input Summary

The student has multiple high-importance, hard tasks due soon, low energy, high stress, and limited available hours.

Example tested workload:

18.95 hours of work
5 available hours
low energy
high stress
multiple high-risk tasks
Expected Behavior

The LLM should choose:

TRIAGE_MODE or WARNING_MODE
Actual Draft Behavior

In testing, the LLM selected:

WARNING_MODE

The model recognized that the workload was unrealistic and recommended immediate outreach to professors, partial completion, prioritizing urgent work, and reassessing lower-priority work.

What This Tests
overload detection
failure case handling
avoidance of unrealistic scheduling
scope reduction recommendations
outreach/extension recommendations
Success Criteria

The app should:

clearly show that workload exceeds available time
avoid pretending everything can be completed
recommend triage, partial completion, or contacting professors
display a warning instead of a normal schedule
compare the LLM result to the deterministic baseline
Draft Observation

The overload demo successfully triggered Warning Mode. This is a successful Project 3 failure/edge case because it shows that the agent does not simply schedule every task when the workload is impossible.

Overall Evaluation Notes

The current draft demonstrates meaningful improvement over Project 2 because the system now includes:

a custom MCP-style tool
tool output displayed in the UI
tool output passed to an LLM
LLM strategy selection
deterministic baseline comparison
overload/failure evaluation
Final Submission Improvements Planned

Before the final submission, the following improvements should be made:

move class/project evidence out of the main product UI
improve student-facing product polish
clarify raw versus adjusted workload calculations
strengthen MCP risk flag logic
add guardrails to prevent planned hours from exceeding available hours
improve local time formatting
complete final screenshots and evaluation notes
