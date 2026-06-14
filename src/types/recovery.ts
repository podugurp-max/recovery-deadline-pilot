// RecoveryPilot — shared types for the MCP-style tool + LLM strategy agent.
// Project 3 capstone: the custom MCP tool analyze_student_load computes
// structured workload facts, and an LLM agent then chooses a strategy mode.

export type Energy = "low" | "medium" | "high";
export type Importance = "low" | "medium" | "high";
export type Difficulty = "easy" | "medium" | "hard";

export type StrategyMode =
  | "SCHEDULE_MODE"
  | "RECOVERY_MODE"
  | "TRIAGE_MODE"
  | "WARNING_MODE";

export interface StudentContext {
  currentDate: string; // ISO date or datetime
  hoursToday: number;
  hoursTomorrow: number;
  energy: Energy;
  stress: Energy;
  fixedCommitments: string;
}

export interface Task {
  id: string;
  name: string;
  course: string;
  dueAt: string; // ISO datetime ("" if missing)
  hoursRemaining: number; // raw estimate
  progress: number; // 0-100
  importance: Importance;
  difficulty: Difficulty;
  notes: string;
}

// Structured output produced by the custom MCP-style tool.
export interface AnalyzeStudentLoadOutput {
  toolName: "analyze_student_load";
  totalRawHours: number;
  availableHours: number;
  capacityRatio: number; // totalRawHours / availableHours
  highRiskTaskCount: number;
  soonestDueDate: string | null;
  riskFlags: string[];
  recommendedMode: StrategyMode;
  explanation: string;
}

// Structured output the LLM is asked to return via the submit_strategy_decision tool call.
export interface StrategyDecision {
  strategyMode: StrategyMode;
  reasoning: string;
  recoveryPlan: { step: string; task?: string; durationHours?: number }[];
  riskWarnings: string[];
  firstAction: string;
  baselineComparison: string;
}

export interface BaselineResult {
  topTask: string | null;
  reason: string;
}

export type AgentResult =
  | { ok: true; source: "live"; decision: StrategyDecision }
  | { ok: true; source: "fallback"; decision: StrategyDecision; error?: string }
  | { ok: false; source: "fallback"; decision: StrategyDecision; error: string };
