// MCP-style tool schema definitions.
// -------------------------------------------------------------
// `analyzeStudentLoadTool` is the human-readable MCP-style schema we expose
// to the LLM as context (name, description, input/output schemas).
// `submitStrategyDecisionDeclaration` is the Gemini function declaration the
// LLM must call to return its autonomous strategy decision.

export const analyzeStudentLoadTool = {
  name: "analyze_student_load",
  description:
    "Analyzes student workload, available time, progress, and risk factors to provide structured context for an academic recovery agent. Returns total raw work hours, available hours, capacity ratio, high-risk task count, soonest due date, risk flags, and a recommended planning mode.",
  inputSchema: {
    type: "object",
    properties: {
      context: {
        type: "object",
        description:
          "Student context: current date, hours available today/tomorrow, energy level, stress level, fixed commitments.",
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
      availableHours: { type: "number" },
      capacityRatio: { type: "number" },
      highRiskTaskCount: { type: "number" },
      soonestDueDate: { type: ["string", "null"] },
      riskFlags: { type: "array", items: { type: "string" } },
      recommendedMode: {
        type: "string",
        enum: ["SCHEDULE_MODE", "RECOVERY_MODE", "TRIAGE_MODE", "WARNING_MODE"],
      },
      explanation: { type: "string" },
    },
    required: [
      "toolName",
      "totalRawHours",
      "availableHours",
      "capacityRatio",
      "highRiskTaskCount",
      "riskFlags",
      "recommendedMode",
      "explanation",
    ],
  },
} as const;

// Gemini function-calling declaration: the LLM must call this with its
// final autonomous strategy decision after seeing the analyze_student_load
// tool output.
export const submitStrategyDecisionDeclaration = {
  name: "submit_strategy_decision",
  description:
    "Submit the autonomous recovery-strategy decision after reviewing the analyze_student_load tool output and student context.",
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
      riskWarnings: { type: "ARRAY", items: { type: "STRING" } },
      firstAction: { type: "STRING" },
      baselineComparison: { type: "STRING" },
    },
    required: [
      "strategyMode",
      "reasoning",
      "recoveryPlan",
      "riskWarnings",
      "firstAction",
      "baselineComparison",
    ],
  },
} as const;
