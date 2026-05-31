# Test Case: Overload Failure Case

## Purpose

This test case checks whether DeadlinePilot avoids false reassurance when the student's workload is impossible.

## Student Context

- Current date: 05/31/2026
- Hours available today: 2
- Hours available tomorrow: 3
- Energy level: Low
- Stress level: High
- Fixed commitments: Work shift 1–8 PM today, class 9–12 tomorrow

## Assignments

### Assignment 1

- Name: Term paper — final draft
- Course: HIST 305
- Due: 06/01/2026 11:55 AM
- Hours remaining: 8
- Weight: 30%
- Progress: 15%
- Difficulty: Hard
- Notes: Thesis still unclear, need sources.

### Assignment 2

- Name: Calculus midterm prep
- Course: MATH 241
- Due: 06/02/2026 01:55 AM
- Hours remaining: 6
- Weight: 35%
- Progress: 10%
- Difficulty: Hard
- Notes: Haven't reviewed integration techniques yet.

### Assignment 3

- Name: Programming assignment 4
- Course: CS 200
- Due: 06/01/2026 03:55 AM
- Hours remaining: 5
- Weight: 15%
- Progress: 25%
- Difficulty: Hard
- Notes: Recursion edge cases failing.

### Assignment 4

- Name: Spanish oral presentation
- Course: SPAN 120
- Due: 06/01/2026 07:55 PM
- Hours remaining: 3
- Weight: 10%
- Progress: 0%
- Difficulty: Medium
- Notes: Need to write and rehearse.

## Planted Signal

The required work is much greater than the available time. The system should detect overload.

## Expected Behavior

DeadlinePilot should:

- classify the workload as overloaded
- state that completing everything is not realistic
- avoid false reassurance
- create a triage plan
- prioritize the highest-risk work
- display risk warnings
- show Reviewer Agent approval only if the plan avoids false reassurance

## Current Draft Result

The current draft passed this test. It classified the case as overloaded and created a triage plan instead of claiming all tasks could be completed.
