// MCP-style tool schema definitions.
// -------------------------------------------------------------
// `analyzeStudentLoadTool` is the human-readable MCP-style tool schema
// (name, description, input/output) that we expose to the LLM as context.
// `submitStrategyDecisionDeclaration` is the Gemini function-calling
// declaration the LLM must invoke to return its autonomous decision.
//
// WHERE THIS SCHEMA IS USED:
//   - Injected into the Gemini prompt in `src/agents/recoveryAgent.ts`
//     alongside the executed tool output, so the model can see what fields
//     the tool guarantees and how to ground its strategy decision.
//   - The submit_strategy_decision declaration is passed as
//     `tools[0].functionDeclarations` to Gemini and forced with
//     functionCallingConfig.mode = "ANY".

export const analyzeStudentLoadTool = {
  name: "analyze_student_load",
  description:
    "Analyzes student workload, available time, progress, and risk factors. Returns raw vs adjusted work hours, capacity ratios, high-risk task count, soonest due date (with a local-time label), risk flags, per-task risk details, and a recommended planning mode.",
  inputSchema: {
    type: "object",
    properties: {
      context: {
        type: "object",
        description:
          "Student context: current date, hours today/tomorrow, energy level, stress level, fixed commitments.",
      },
      tasks: {
        type: "array",
        description:
          "Academic tasks with name, course, due date, raw hours remaining, progress %, importance, difficulty, and notes.",
      },
    },
    required: ["context", "tasks"],
  },
  outputSchema: {
    type: "object",
    properties: {
      toolName: { type: "string", const: "analyze_student_load" },
      totalRawHours: { type: "number" },
      adjustedWorkHours: { type: "number" },
      availableHours: { type: "number" },
      capacityRatioRaw: { type: "number" },
      capacityRatioAdjusted: { type: "number" },
      highRiskTaskCount: { type: "number" },
      soonestDueDate: { type: ["string", "null"] },
      soonestDueLabel: { type: ["string", "null"] },
      riskFlags: { type: "array", items: { type: "string" } },
      taskRisks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            taskName: { type: "string" },
            urgencyLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
            reasons: { type: "array", items: { type: "string" } },
          },
        },
      },
      recommendedMode: {
        type: "string",
        enum: ["SCHEDULE_MODE", "RECOVERY_MODE", "TRIAGE_MODE", "WARNING_MODE"],
      },
      explanation: { type: "string" },
    },
    required: [
      "toolName", "totalRawHours", "adjustedWorkHours", "availableHours",
      "capacityRatioRaw", "capacityRatioAdjusted", "highRiskTaskCount",
      "riskFlags", "taskRisks", "recommendedMode", "explanation",
    ],
  },
} as const;

// Gemini function-calling declaration: the LLM must call this with its
// final autonomous strategy decision after reading the tool output.
export const submitStrategyDecisionDeclaration = {
  name: "submit_strategy_decision",
  description:
    "Submit the autonomous recovery-strategy decision after reviewing analyze_student_load output and student context. The sum of durationHours in recoveryPlan must not exceed availableHours.",
  parameters: {
    type: "OBJECT",
    properties: {
      strategyMode: {
        type: "STRING",
        enum: ["SCHEDULE_MODE", "RECOVERY_MODE", "TRIAGE_MODE", "WARNING_MODE"],
      },
      reasoning: { type: "STRING" },
      recoveryPlan: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            step: { type: "STRING" },
            task: { type: "STRING" },
            durationHours: { type: "NUMBER" },
          },
          required: ["step"],
        },
      },
      notScheduled: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            task: { type: "STRING" },
            reason: { type: "STRING" },
          },
          required: ["task", "reason"],
        },
      },
      riskWarnings: { type: "ARRAY", items: { type: "STRING" } },
      firstAction: { type: "STRING" },
      baselineComparison: { type: "STRING" },
    },
    required: [
      "strategyMode", "reasoning", "recoveryPlan",
      "riskWarnings", "firstAction", "baselineComparison",
    ],
  },
} as const;
