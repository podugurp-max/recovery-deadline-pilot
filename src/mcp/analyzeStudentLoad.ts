// Custom MCP-style tool: analyze_student_load
// -------------------------------------------------------------
// WHERE THE CUSTOM TOOL IS DEFINED:
//   - Schema (name, description, input/output): src/mcp/mcpToolDefinitions.ts
//   - Tool logic (this file): computes structured workload facts.
// WHERE THE TOOL IS EXECUTED:
//   - Pre-executed in `src/routes/index.tsx` before calling the LLM agent.
// WHERE THE TOOL OUTPUT IS EXPOSED TO GEMINI:
//   - Embedded in the user prompt in `src/agents/recoveryAgent.ts`,
//     alongside the MCP tool definition, so Gemini can ground its
//     final autonomous strategy decision on these facts.
// WHERE THE DETERMINISTIC BASELINE IS CALCULATED SEPARATELY:
//   - `computeBaseline()` at the bottom of this file is intentionally
//     dumb (earliest-due-date) so we can contrast it with the LLM choice.

import type {
  AnalyzeStudentLoadOutput,
  BaselineResult,
  StrategyMode,
  StudentContext,
  Task,
  TaskRisk,
} from "@/types/recovery";

const remainingHours = (t: Task) =>
  Math.max(0, (t.hoursRemaining || 0) * (1 - (t.progress || 0) / 100));

const hoursUntil = (nowMs: number, dueAt: string): number | null => {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (!isFinite(due)) return null;
  return (due - nowMs) / 3_600_000;
};

const BLOCKER_WORDS = [
  "unclear", "blocked", "waiting", "teammate", "forgot", "failing",
  "missing", "confused", "need sources", "not responding", "stuck",
  "haven't reviewed", "haven't started", "no idea",
];

const containsBlocker = (notes: string): string[] => {
  const lower = (notes || "").toLowerCase();
  return BLOCKER_WORDS.filter((w) => lower.includes(w));
};

const difficultyMultiplier = (d: Task["difficulty"]) =>
  d === "hard" ? 1.4 : d === "easy" ? 1.0 : 1.15;

const formatLocalDue = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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

  // Raw hours = exact sum of user-estimated remaining hours (after progress).
  const totalRawHours = tasks.reduce((s, t) => s + remainingHours(t), 0);

  // Adjusted hours scale by difficulty and the student's current energy/stress.
  const energyAdj = context.energy === "low" ? 1.2 : context.energy === "high" ? 0.9 : 1.0;
  const stressAdj = context.stress === "high" ? 1.15 : 1.0;
  const adjustedWorkHours = tasks.reduce(
    (s, t) => s + remainingHours(t) * difficultyMultiplier(t.difficulty) * energyAdj * stressAdj,
    0,
  );

  const availableHours =
    Math.max(0, context.hoursToday || 0) + Math.max(0, context.hoursTomorrow || 0);

  const capacityRatioRaw =
    availableHours > 0 ? totalRawHours / availableHours : totalRawHours > 0 ? Infinity : 0;
  const capacityRatioAdjusted =
    availableHours > 0
      ? adjustedWorkHours / availableHours
      : adjustedWorkHours > 0
        ? Infinity
        : 0;

  const riskFlags: string[] = [];
  const taskRisks: TaskRisk[] = [];
  let highRiskTaskCount = 0;
  const dueTimes: number[] = [];

  for (const t of tasks) {
    const due = new Date(t.dueAt).getTime();
    if (isFinite(due)) dueTimes.push(due);
    const hoursUntilDue = hoursUntil(nowMs, t.dueAt);
    const remaining = remainingHours(t);
    const blockers = containsBlocker(t.notes);
    const reasons: string[] = [];
    let urgency: TaskRisk["urgencyLevel"] = "low";

    if (hoursUntilDue !== null && hoursUntilDue < 0) {
      reasons.push("Already past due.");
      urgency = "critical";
    } else if (hoursUntilDue !== null && hoursUntilDue < 12) {
      reasons.push(`Due in under 12 hours (${hoursUntilDue.toFixed(1)}h left).`);
      urgency = "critical";
    } else if (hoursUntilDue !== null && hoursUntilDue < 24) {
      reasons.push(`Due in under 24 hours (${hoursUntilDue.toFixed(1)}h left).`);
      if (urgency === "low") urgency = "high";
    }
    if (
      hoursUntilDue !== null &&
      hoursUntilDue >= 0 &&
      hoursUntilDue < 12 &&
      remaining > hoursUntilDue
    ) {
      reasons.push(
        `Likely unachievable: ${remaining.toFixed(1)}h work vs ${hoursUntilDue.toFixed(1)}h left.`,
      );
      urgency = "critical";
    }
    if (t.importance === "high" && t.progress < 30) {
      reasons.push("High-importance task under 30% complete.");
      if (urgency !== "critical") urgency = "high";
    }
    if (t.difficulty === "hard" && t.progress < 30) {
      reasons.push("Hard task under 30% complete.");
      if (urgency === "low") urgency = "medium";
    }
    if (blockers.length) {
      reasons.push(`Notes mention blocker(s): ${blockers.join(", ")}.`);
      if (urgency === "low") urgency = "medium";
    }

    if (reasons.length) {
      taskRisks.push({
        taskName: t.name || t.course || "Unnamed task",
        urgencyLevel: urgency,
        reasons,
      });
      if (urgency === "high" || urgency === "critical") highRiskTaskCount += 1;
    }
  }

  // Workload-level risk flags
  if (!isFinite(capacityRatioRaw))
    riskFlags.push("No available hours entered — capacity is undefined.");
  else if (capacityRatioRaw >= 2.0)
    riskFlags.push(`Severe overload: workload is ${capacityRatioRaw.toFixed(2)}× available time.`);
  else if (capacityRatioRaw >= 1.25)
    riskFlags.push(`Workload exceeds available capacity (${capacityRatioRaw.toFixed(2)}×).`);
  else if (capacityRatioRaw >= 1.0)
    riskFlags.push(`Workload meets or exceeds available time (${capacityRatioRaw.toFixed(2)}×).`);
  else if (capacityRatioRaw >= 0.85)
    riskFlags.push(`Minimal time buffer (${capacityRatioRaw.toFixed(2)}× of available time).`);

  if (context.energy === "low") riskFlags.push("Student energy level is low.");
  if (context.stress === "high") riskFlags.push("Student stress level is high.");

  for (const tr of taskRisks) {
    if (tr.urgencyLevel === "critical") {
      riskFlags.push(`Critical: "${tr.taskName}" — ${tr.reasons[0]}`);
    }
  }
  // Surface blocker notes at the workload level so they aren't lost.
  for (const t of tasks) {
    const blockers = containsBlocker(t.notes);
    if (blockers.length) {
      riskFlags.push(
        `"${t.name || t.course || "Unnamed task"}" notes flag possible blocker (${blockers.join(", ")}).`,
      );
    }
  }
  if (highRiskTaskCount >= 3)
    riskFlags.push(`${highRiskTaskCount} high-risk tasks competing for attention.`);

  const soonestDueDate =
    dueTimes.length > 0 ? new Date(Math.min(...dueTimes)).toISOString() : null;
  const soonestDueLabel = soonestDueDate ? formatLocalDue(soonestDueDate) : null;

  // Recommended mode (the LLM may override).
  let recommendedMode: StrategyMode;
  const ratio = isFinite(capacityRatioRaw) ? capacityRatioRaw : 999;
  if (ratio <= 0.85) recommendedMode = "SCHEDULE_MODE";
  else if (ratio <= 1.1) recommendedMode = "RECOVERY_MODE";
  else if (ratio <= 1.75) recommendedMode = "TRIAGE_MODE";
  else recommendedMode = "WARNING_MODE";

  if (
    context.energy === "low" &&
    context.stress === "high" &&
    recommendedMode === "SCHEDULE_MODE"
  ) {
    recommendedMode = "RECOVERY_MODE";
  }

  const explanation =
    `Estimated ${totalRawHours.toFixed(1)}h of raw work (${adjustedWorkHours.toFixed(1)}h difficulty/energy-adjusted) ` +
    `vs ${availableHours.toFixed(1)}h available. ` +
    `Raw capacity ratio ${isFinite(capacityRatioRaw) ? capacityRatioRaw.toFixed(2) : "∞"}, ` +
    `adjusted ${isFinite(capacityRatioAdjusted) ? capacityRatioAdjusted.toFixed(2) : "∞"}. ` +
    `${highRiskTaskCount} high-risk task(s). Tool's recommended (non-final) mode: ${recommendedMode}.`;

  return {
    toolName: "analyze_student_load",
    totalRawHours: +totalRawHours.toFixed(2),
    adjustedWorkHours: +adjustedWorkHours.toFixed(2),
    availableHours: +availableHours.toFixed(2),
    capacityRatioRaw: isFinite(capacityRatioRaw) ? +capacityRatioRaw.toFixed(3) : 999,
    capacityRatioAdjusted: isFinite(capacityRatioAdjusted) ? +capacityRatioAdjusted.toFixed(3) : 999,
    highRiskTaskCount,
    soonestDueDate,
    soonestDueLabel,
    riskFlags,
    taskRisks,
    recommendedMode,
    explanation,
  };
}

// Deterministic baseline (intentionally simple): pick the soonest due task.
// This is computed entirely separately from the LLM so the reviewer can see
// what the model adds on top of basic due-date sorting.
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
    reason: `Earliest-due-date baseline picks "${top.name || top.course}" because it is due first (${formatLocalDue(top.dueAt)}). It ignores importance, progress, difficulty, energy, and stress.`,
  };
}
