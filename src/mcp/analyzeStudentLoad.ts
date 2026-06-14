// Custom MCP-style tool: analyze_student_load
// -------------------------------------------------------------
// This is a custom MCP-STYLE tool implemented inside the codebase
// (not an external MCP server). It is defined here, its schema is
// exported from `src/mcp/mcpToolDefinitions.ts`, and its output is
// passed into the LLM call inside `src/agents/recoveryAgent.ts`,
// where the LLM uses the structured facts to autonomously choose a
// recovery strategy mode.

import type {
  AnalyzeStudentLoadOutput,
  BaselineResult,
  StrategyMode,
  StudentContext,
  Task,
} from "@/types/recovery";

const remainingHours = (t: Task) =>
  Math.max(0, (t.hoursRemaining || 0) * (1 - (t.progress || 0) / 100));

const hoursUntil = (nowMs: number, dueAt: string): number | null => {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (!isFinite(due)) return null;
  return (due - nowMs) / 3_600_000;
};

export function analyzeStudentLoad(input: {
  context: StudentContext;
  tasks: Task[];
}): AnalyzeStudentLoadOutput {
  const { context, tasks } = input;

  const nowMs = (() => {
    const t = new Date(context.currentDate).getTime();
    return isFinite(t) ? t : Date.now();
  })();

  const totalRawHours = tasks.reduce((s, t) => s + remainingHours(t), 0);
  const availableHours =
    Math.max(0, context.hoursToday || 0) + Math.max(0, context.hoursTomorrow || 0);

  const capacityRatio =
    availableHours > 0 ? totalRawHours / availableHours : totalRawHours > 0 ? Infinity : 0;

  const riskFlags: string[] = [];
  let highRiskTaskCount = 0;

  const dueTimes: number[] = [];
  for (const t of tasks) {
    const due = new Date(t.dueAt).getTime();
    if (isFinite(due)) dueTimes.push(due);

    const hoursUntilDue = hoursUntil(nowMs, t.dueAt);
    const remaining = remainingHours(t);
    const isHighRisk =
      t.importance === "high" ||
      t.difficulty === "hard" ||
      (hoursUntilDue !== null && hoursUntilDue < 24 && remaining > 2);
    if (isHighRisk) highRiskTaskCount += 1;

    if (
      hoursUntilDue !== null &&
      hoursUntilDue >= 0 &&
      hoursUntilDue < 12 &&
      remaining > hoursUntilDue
    ) {
      riskFlags.push(
        `"${t.name || t.course || "Unnamed task"}" likely unachievable in remaining time (${remaining.toFixed(1)}h work, ${hoursUntilDue.toFixed(1)}h left).`,
      );
    }
    if (hoursUntilDue !== null && hoursUntilDue < 0) {
      riskFlags.push(`"${t.name || "Unnamed task"}" is already past due.`);
    }
  }

  const soonestDueDate =
    dueTimes.length > 0 ? new Date(Math.min(...dueTimes)).toISOString() : null;

  if (capacityRatio === Infinity)
    riskFlags.push("No available hours entered — capacity is undefined.");
  else if (capacityRatio > 1.5)
    riskFlags.push(`Workload is ${capacityRatio.toFixed(2)}× available capacity.`);
  else if (capacityRatio > 1.0)
    riskFlags.push(`Slightly over capacity (${capacityRatio.toFixed(2)}×).`);

  if (context.energy === "low") riskFlags.push("Student energy is low.");
  if (context.stress === "high") riskFlags.push("Student stress is high.");
  if (highRiskTaskCount >= 3)
    riskFlags.push(`${highRiskTaskCount} high-risk tasks competing for attention.`);

  let recommendedMode: StrategyMode;
  if (!isFinite(capacityRatio)) recommendedMode = "WARNING_MODE";
  else if (capacityRatio <= 0.85) recommendedMode = "SCHEDULE_MODE";
  else if (capacityRatio <= 1.1) recommendedMode = "RECOVERY_MODE";
  else if (capacityRatio <= 1.75) recommendedMode = "TRIAGE_MODE";
  else recommendedMode = "WARNING_MODE";

  if (
    context.energy === "low" &&
    context.stress === "high" &&
    recommendedMode === "SCHEDULE_MODE"
  ) {
    recommendedMode = "RECOVERY_MODE";
  }

  const explanation =
    `Computed ${totalRawHours.toFixed(1)}h of remaining work against ${availableHours.toFixed(1)}h ` +
    `available (capacity ratio ${isFinite(capacityRatio) ? capacityRatio.toFixed(2) : "∞"}). ` +
    `${highRiskTaskCount} task(s) flagged as high risk. ` +
    `Tool's recommended mode (not final): ${recommendedMode}.`;

  return {
    toolName: "analyze_student_load",
    totalRawHours: +totalRawHours.toFixed(2),
    availableHours: +availableHours.toFixed(2),
    capacityRatio: isFinite(capacityRatio) ? +capacityRatio.toFixed(3) : 999,
    highRiskTaskCount,
    soonestDueDate,
    riskFlags,
    recommendedMode,
    explanation,
  };
}

// Deterministic baseline used to contrast against the LLM's autonomous decision.
// Simple rule: prioritize the task with the soonest due date.
export function computeBaseline(tasks: Task[]): BaselineResult {
  const dated = tasks
    .filter((t) => t.dueAt && isFinite(new Date(t.dueAt).getTime()))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  if (dated.length === 0) {
    return {
      topTask: null,
      reason: "No tasks have a usable due date, so an earliest-due baseline cannot pick one.",
    };
  }
  const top = dated[0];
  return {
    topTask: top.name || top.course || "Unnamed task",
    reason: `Earliest-due-date baseline picks "${top.name || top.course}" because it is due first (${new Date(top.dueAt).toLocaleString()}). It ignores importance, progress, difficulty, energy, and stress.`,
  };
}
