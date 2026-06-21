# Custom MCP-style Tool: `analyze_student_load`

RecoveryPilot exposes a single custom MCP-style tool to the Gemini recovery agent. It is implemented in-codebase using the Gemini function-calling shape — not a connection to a separate external MCP server. The documentation and UI describe it honestly as such.

## Schema

Defined in `src/mcp/mcpToolDefinitions.ts`.

- **name:** `analyze_student_load`
- **description:** "Analyzes student workload, available time, progress, and risk factors..."
- **inputSchema:** `{ context, tasks }`
- **outputSchema:** `toolName`, `totalRawHours`, `adjustedWorkHours`, `availableHours`, `capacityRatioRaw`, `capacityRatioAdjusted`, `highRiskTaskCount`, `soonestDueDate`, `soonestDueLabel`, `riskFlags`, `taskRisks`, `recommendedMode`, `explanation`.

## Logic

Defined in `src/mcp/analyzeStudentLoad.ts`.

- `totalRawHours` = sum of `hoursRemaining * (1 - progress/100)` across tasks.
- `adjustedWorkHours` = raw hours × difficulty multiplier × energy multiplier × stress multiplier.
- Capacity ratios derived against `hoursToday + hoursTomorrow`.
- Per-task risk pass detects: past due, due within 12h/24h, likely-unachievable, high-importance under 30% progress, hard tasks under 30% progress, and blocker keywords in notes.
- Workload-level `riskFlags` buckets at 0.85 / 1.0 / 1.25 / 2.0× capacity, plus low energy / high stress, plus blocker-note surfacing, plus a "3+ high-risk tasks" flag.
- Recommended mode is a non-final hint; the LLM is allowed to override it.

## How the tool is exposed to the LLM

In `src/agents/recoveryAgent.ts` the prompt to Gemini contains:

1. The tool **schema** (so the model can see the shape of what it's reading).
2. The **already-executed structured output** (so the model can ground its decision on facts).
3. The deterministic baseline result (for contrast).

Gemini is then required to respond by invoking the `submit_strategy_decision` function (also declared in `mcpToolDefinitions.ts`) with `strategyMode`, `reasoning`, `recoveryPlan`, `notScheduled`, `riskWarnings`, `firstAction`, and `baselineComparison`.

## Where each step lives

| Step | File |
| --- | --- |
| Tool schema | `src/mcp/mcpToolDefinitions.ts` |
| Tool logic | `src/mcp/analyzeStudentLoad.ts` |
| Tool execution | `src/routes/index.tsx` (`run()`) |
| LLM wiring | `src/agents/recoveryAgent.ts` |
| Baseline | `computeBaseline()` in `src/mcp/analyzeStudentLoad.ts` |
| UI trace | "View raw tool trace" section in `src/routes/index.tsx` |
