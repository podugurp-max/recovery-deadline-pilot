export type Energy = "low" | "medium" | "high";
export type Difficulty = "easy" | "medium" | "hard";
export type Feasibility = "manageable" | "tight" | "overloaded";

export interface StudentContext {
  currentDate: string;
  hoursToday: number;
  hoursTomorrow: number;
  energy: Energy;
  stress: Energy;
  fixedCommitments: string;
}

export interface Assignment {
  id: string;
  name: string;
  course: string;
  dueAt: string; // ISO datetime
  hoursRemaining: number;
  weight: number; // 0-100 importance/grade weight
  progress: number; // 0-100
  difficulty: Difficulty;
  notes: string;
}

export interface RankedAssignment extends Assignment {
  score: number;
  hoursUntilDue: number;
  rationale: string;
}

export interface RecoveryPlanStep {
  assignmentId: string;
  assignmentName: string;
  block: "today" | "tomorrow" | "after" | "triage-defer" | "triage-partial";
  hoursAllocated: number;
  note: string;
}

export interface RecoveryPlan {
  summary: string;
  feasibility: Feasibility;
  requiredHours: number;
  availableHours: number;
  workloadRatio: number;
  ranking: RankedAssignment[];
  plan: RecoveryPlanStep[];
  firstNextAction: string;
  risks: string[];
  missingInfo: string[];
  reviewerCheck: string;
  reviewerApproved: boolean;
  trace: AgentTrace[];
}

export interface AgentTrace {
  agent:
    | "Task Parser Agent"
    | "Priority Agent"
    | "Feasibility Agent"
    | "Schedule Builder Agent"
    | "Risk Agent"
    | "Reviewer Agent";
  output: string;
  details?: string[];
}

const diffWeight: Record<Difficulty, number> = { easy: 1, medium: 1.25, hard: 1.6 };

function hoursBetween(fromIso: string, toIso: string) {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  return (b - a) / (1000 * 60 * 60);
}

export function runRecovery(
  ctx: StudentContext,
  assignments: Assignment[],
): RecoveryPlan {
  const trace: AgentTrace[] = [];
  const missingInfo: string[] = [];

  // Task Parser
  const parsed = assignments.filter((a) => a.name.trim() !== "");
  parsed.forEach((a) => {
    if (!a.dueAt) missingInfo.push(`${a.name || "Unnamed"}: missing due date`);
    if (!a.hoursRemaining && a.hoursRemaining !== 0)
      missingInfo.push(`${a.name}: missing hours estimate`);
  });
  trace.push({
    agent: "Task Parser Agent",
    output: `Parsed ${parsed.length} assignment${parsed.length === 1 ? "" : "s"}.`,
    details: parsed.map(
      (a) =>
        `${a.name} (${a.course}) — ${a.hoursRemaining}h left, ${a.progress}% done, due ${a.dueAt || "?"}`,
    ),
  });

  // Priority Agent
  const now = ctx.currentDate || new Date().toISOString();
  const ranked: RankedAssignment[] = parsed
    .map((a) => {
      const hUntilDue = a.dueAt ? hoursBetween(now, a.dueAt) : 9999;
      const urgency = 1 / Math.max(hUntilDue, 1); // higher = closer
      const remainingRatio = 1 - a.progress / 100;
      const score =
        urgency * 60 +
        (a.weight / 100) * 25 +
        remainingRatio * 10 +
        (diffWeight[a.difficulty] - 1) * 5;
      const rationale = `Due in ${hUntilDue.toFixed(1)}h · weight ${a.weight}% · ${a.progress}% done · ${a.difficulty}`;
      return { ...a, score, hoursUntilDue: hUntilDue, rationale };
    })
    .sort((a, b) => b.score - a.score);
  trace.push({
    agent: "Priority Agent",
    output: `Ranked ${ranked.length} tasks by urgency, weight, progress, difficulty.`,
    details: ranked.map((r, i) => `${i + 1}. ${r.name} — ${r.rationale}`),
  });

  // Feasibility Agent
  const requiredHours = parsed.reduce(
    (sum, a) => sum + a.hoursRemaining * diffWeight[a.difficulty],
    0,
  );
  const availableHours = (ctx.hoursToday || 0) + (ctx.hoursTomorrow || 0);
  const ratio = availableHours > 0 ? requiredHours / availableHours : Infinity;
  let feasibility: Feasibility = "manageable";
  if (ratio > 1.15) feasibility = "overloaded";
  else if (ratio >= 0.86) feasibility = "tight";
  trace.push({
    agent: "Feasibility Agent",
    output: `Required ${requiredHours.toFixed(1)}h vs available ${availableHours.toFixed(1)}h → ratio ${ratio.toFixed(2)} → ${feasibility}.`,
    details: [
      "Difficulty multipliers: easy×1.0, medium×1.25, hard×1.6.",
      `Workload thresholds: ≤0.85 manageable, 0.86–1.15 tight, ≥1.16 overloaded.`,
    ],
  });

  // Schedule Builder
  const plan: RecoveryPlanStep[] = [];
  let todayLeft = ctx.hoursToday || 0;
  let tomorrowLeft = ctx.hoursTomorrow || 0;
  for (const task of ranked) {
    const needed = task.hoursRemaining * diffWeight[task.difficulty];
    if (feasibility === "overloaded" && needed > todayLeft + tomorrowLeft) {
      // Partial allocation or defer for lower-priority tasks
      const give = Math.min(needed, todayLeft + tomorrowLeft);
      if (give <= 0) {
        plan.push({
          assignmentId: task.id,
          assignmentName: task.name,
          block: "triage-defer",
          hoursAllocated: 0,
          note: "Triage: defer or request extension — cannot fit before deadline.",
        });
        continue;
      }
      const fromToday = Math.min(todayLeft, give);
      todayLeft -= fromToday;
      const fromTomorrow = Math.min(tomorrowLeft, give - fromToday);
      tomorrowLeft -= fromTomorrow;
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "triage-partial",
        hoursAllocated: fromToday + fromTomorrow,
        note: `Triage partial: aim for highest-impact ${(fromToday + fromTomorrow).toFixed(1)}h of work, not full completion.`,
      });
      continue;
    }
    // Normal allocation
    let remaining = needed;
    const fromToday = Math.min(todayLeft, remaining);
    if (fromToday > 0) {
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "today",
        hoursAllocated: fromToday,
        note: `Work ${fromToday.toFixed(1)}h today.`,
      });
      todayLeft -= fromToday;
      remaining -= fromToday;
    }
    if (remaining > 0) {
      const fromTomorrow = Math.min(tomorrowLeft, remaining);
      if (fromTomorrow > 0) {
        plan.push({
          assignmentId: task.id,
          assignmentName: task.name,
          block: "tomorrow",
          hoursAllocated: fromTomorrow,
          note: `Continue ${fromTomorrow.toFixed(1)}h tomorrow.`,
        });
        tomorrowLeft -= fromTomorrow;
        remaining -= fromTomorrow;
      }
    }
    if (remaining > 0.05) {
      plan.push({
        assignmentId: task.id,
        assignmentName: task.name,
        block: "after",
        hoursAllocated: remaining,
        note: `${remaining.toFixed(1)}h still need a slot beyond today/tomorrow.`,
      });
    }
  }
  trace.push({
    agent: "Schedule Builder Agent",
    output:
      feasibility === "overloaded"
        ? "Built a triage plan — not all work will be completed."
        : "Allocated work across today and tomorrow by priority.",
    details: plan.map(
      (p) => `${p.assignmentName} → ${p.block} (${p.hoursAllocated.toFixed(1)}h)`,
    ),
  });

  // Risk Agent
  const risks: string[] = [];
  if (feasibility === "overloaded")
    risks.push("Workload exceeds available time — completing everything is not realistic.");
  if (ctx.energy === "low" && requiredHours > 4)
    risks.push("Low energy with >4h of work — productivity per hour will drop; build in breaks.");
  if (ctx.stress === "high")
    risks.push("High stress reported — risk of avoidance/procrastination spiral.");
  ranked.forEach((r) => {
    if (r.hoursUntilDue < 12 && r.progress < 50)
      risks.push(
        `${r.name} is due in <12h and only ${r.progress}% done — high risk of missing deadline.`,
      );
    if (r.difficulty === "hard" && r.hoursUntilDue < 24 && r.progress < 30)
      risks.push(`${r.name} is hard, <24h out, low progress — consider asking for help now.`);
  });
  trace.push({
    agent: "Risk Agent",
    output: `${risks.length} risk${risks.length === 1 ? "" : "s"} identified.`,
    details: risks,
  });

  // First next action
  const firstTask = ranked[0];
  const firstNextAction = firstTask
    ? `Start ${firstTask.name} (${firstTask.course}) right now for a focused ${Math.min(
        90,
        Math.max(25, Math.round(firstTask.hoursRemaining * 30)),
      )}-minute block — it has the highest urgency × impact score.`
    : "Add at least one assignment to get a recommendation.";

  // Summary
  const summary =
    parsed.length === 0
      ? "No assignments entered yet."
      : `${parsed.length} active assignment${parsed.length === 1 ? "" : "s"} · ${requiredHours.toFixed(1)}h of weighted work vs ${availableHours.toFixed(1)}h available across today and tomorrow. Status: ${feasibility.toUpperCase()}.`;

  // Reviewer Agent
  const reviewerIssues: string[] = [];
  if (feasibility === "overloaded" && !plan.some((p) => p.block.startsWith("triage")))
    reviewerIssues.push("Overloaded status without triage steps — plan is unrealistic.");
  if (missingInfo.length > 0)
    reviewerIssues.push(`${missingInfo.length} field(s) missing — recommendations may be off.`);
  if (parsed.length > 0 && availableHours === 0)
    reviewerIssues.push("Zero available hours entered — cannot schedule anything.");
  const reviewerCheck =
    reviewerIssues.length === 0
      ? "Plan is internally consistent. Feasibility matches schedule; risks acknowledged."
      : reviewerIssues.join(" ");
  trace.push({
    agent: "Reviewer Agent",
    output: reviewerCheck,
    details: reviewerIssues,
  });

  return {
    summary,
    feasibility,
    requiredHours,
    availableHours,
    workloadRatio: ratio,
    ranking: ranked,
    plan,
    firstNextAction,
    risks,
    missingInfo,
    reviewerCheck,
    trace,
  };
}
