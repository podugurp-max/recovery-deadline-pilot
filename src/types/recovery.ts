// RecoveryPilot — shared types for the MCP-style tool + LLM strategy agent.

export type Energy = "low" | "medium" | "high";
export type Importance = "low" | "medium" | "high";
export type Difficulty = "easy" | "medium" | "hard";

export type StrategyMode =
  | "SCHEDULE_MODE"
  | "RECOVERY_MODE"
  | "TRIAGE_MODE"
  | "WARNING_MODE";

export interface StudentContext {
  currentDate: string;
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
  dueAt: string;
  hoursRemaining: number;
  progress: number;
  importance: Importance;
  difficulty: Difficulty;
  notes: string;
}

export interface TaskRisk {
  taskName: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
}

// Structured output produced by the custom MCP-style tool.
export interface AnalyzeStudentLoadOutput {
  toolName: "analyze_student_load";
  totalRawHours: number;          // exact sum of user-estimated hours remaining
  adjustedWorkHours: number;      // raw hours scaled for difficulty/progress/energy/stress
  availableHours: number;
  capacityRatioRaw: number;       // totalRawHours / availableHours
  capacityRatioAdjusted: number;  // adjustedWorkHours / availableHours
  highRiskTaskCount: number;
  soonestDueDate: string | null;
  soonestDueLabel: string | null; // human-friendly, local-time formatted
  riskFlags: string[];
  taskRisks: TaskRisk[];
  recommendedMode: StrategyMode;
  explanation: string;
}

export interface StrategyDecision {
  strategyMode: StrategyMode;
  reasoning: string;
  recoveryPlan: { step: string; task?: string; durationHours?: number }[];
  notScheduled?: { task: string; reason: string }[];
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
