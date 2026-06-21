import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus, Play, Trash2, Sparkles, Wrench, FlaskConical, ShieldAlert,
  GitCompare, Cpu, AlertTriangle, CheckCircle2, Loader2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useServerFn } from "@tanstack/react-start";
import { analyzeStudentLoad, computeBaseline } from "@/mcp/analyzeStudentLoad";
import {
  analyzeStudentLoadTool,
  submitStrategyDecisionDeclaration,
} from "@/mcp/mcpToolDefinitions";
import { runRecoveryAgent } from "@/agents/recoveryAgent";
import type {
  AgentResult, AnalyzeStudentLoadOutput, BaselineResult,
  Energy, Importance, Difficulty, StrategyMode, StudentContext, Task,
} from "@/types/recovery";
import {
  normalWorkloadDemo, messyInputDemo, overloadFailureDemo,
  type RecoveryFixture,
} from "@/lib/recovery-fixtures";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecoveryPilot — AI academic recovery planner" },
      {
        name: "description",
        content:
          "RecoveryPilot turns deadlines, limited time, and stress into a realistic recovery plan for overloaded students.",
      },
      { property: "og:title", content: "RecoveryPilot" },
      {
        property: "og:description",
        content:
          "AI academic recovery planner for overloaded students. Turn deadlines, limited time, and stress into a realistic recovery plan.",
      },
    ],
  }),
  component: RecoveryPilot,
});

const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const newTask = (): Task => ({
  id: crypto.randomUUID(),
  name: "", course: "", dueAt: "",
  hoursRemaining: 1, progress: 0,
  importance: "medium", difficulty: "medium", notes: "",
});

interface RunResult {
  toolOutput: AnalyzeStudentLoadOutput;
  baseline: BaselineResult;
  agent: AgentResult;
}

function RecoveryPilot() {
  const [ctx, setCtx] = useState<StudentContext>({
    currentDate: todayLocal(),
    hoursToday: 3, hoursTomorrow: 5,
    energy: "medium", stress: "medium",
    fixedCommitments: "",
  });
  const [tasks, setTasks] = useState<Task[]>([newTask(), newTask(), newTask()]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const runAgent = useServerFn(runRecoveryAgent);

  const update = <K extends keyof StudentContext>(k: K, v: StudentContext[K]) =>
    setCtx((c) => ({ ...c, [k]: v }));
  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTask = (id: string) => setTasks((all) => all.filter((t) => t.id !== id));

  const loadFixture = (f: RecoveryFixture) => {
    setCtx(f.context);
    setTasks(f.tasks.map((t) => ({ ...t, id: crypto.randomUUID() })));
    setResult(null);
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    const ctxIso: StudentContext = {
      ...ctx,
      currentDate: new Date(ctx.currentDate + "T00:00:00").toISOString(),
    };
    const toolOutput = analyzeStudentLoad({ context: ctxIso, tasks });
    const baseline = computeBaseline(tasks);
    try {
      const agent = await runAgent({
        data: { context: ctxIso, tasks, toolOutput, baseline },
      });
      setResult({ toolOutput, baseline, agent });
    } catch (e) {
      setResult({
        toolOutput, baseline,
        agent: {
          ok: false, source: "fallback",
          error: e instanceof Error ? e.message : "Network error.",
          decision: {
            strategyMode: toolOutput.recommendedMode,
            reasoning: "Network error reaching the LLM agent. Falling back to the tool's recommended mode.",
            recoveryPlan: [],
            riskWarnings: toolOutput.riskFlags,
            firstAction: baseline.topTask
              ? `Start with "${baseline.topTask}" as a safe baseline pick.`
              : "Pick the most important task and start a focused block.",
            baselineComparison: baseline.reason,
          },
        },
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border bg-gradient-to-br from-card to-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                RecoveryPilot
              </h1>
              <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                AI academic recovery planner for overloaded students
              </p>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Turn deadlines, limited time, and stress into a realistic recovery plan.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* How it works */}
        <Section title="How it works">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <HowStep n={1} title="Tell us about your week" desc="Enter your tasks, deadlines, available time, energy, and stress level." />
            <HowStep n={2} title="We analyze the workload" desc="RecoveryPilot analyzes workload risk and gives the AI agent structured context." />
            <HowStep n={3} title="Get a realistic plan" desc="Review a strategy, recovery plan, risk warnings, and what to do first." />
          </div>
        </Section>

        {/* Demos */}
        <Section
          icon={<FlaskConical className="h-5 w-5 text-primary" />}
          title="Try example scenarios"
          subtitle="Load a sample workload, then run the recovery agent."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DemoButton tone="success" title="Normal workload"
              caption="Enough time for a realistic schedule"
              onClick={() => loadFixture(normalWorkloadDemo)} />
            <DemoButton tone="warning" title="Messy student input"
              caption="Vague tasks, blockers, and tight timing"
              onClick={() => loadFixture(messyInputDemo)} />
            <DemoButton tone="danger" title="Overload warning case"
              caption="More work than time, requiring triage"
              onClick={() => loadFixture(overloadFailureDemo)} />
          </div>
        </Section>

        {/* Student Context */}
        <Section title="Your week">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="date">Current date</Label>
              <Input id="date" type="date" value={ctx.currentDate}
                onChange={(e) => update("currentDate", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="today">Available hours today</Label>
              <Input id="today" type="number" min={0} step={0.5} value={ctx.hoursToday}
                onChange={(e) => update("hoursToday", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="tomorrow">Available hours tomorrow</Label>
              <Input id="tomorrow" type="number" min={0} step={0.5} value={ctx.hoursTomorrow}
                onChange={(e) => update("hoursTomorrow", Number(e.target.value))} />
            </div>
            <div>
              <Label>Energy level</Label>
              <Select value={ctx.energy} onValueChange={(v) => update("energy", v as Energy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stress level</Label>
              <Select value={ctx.stress} onValueChange={(v) => update("stress", v as Energy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="commitments">Fixed commitments</Label>
              <Textarea id="commitments" rows={2} value={ctx.fixedCommitments}
                onChange={(e) => update("fixedCommitments", e.target.value)}
                placeholder="Classes, work shift 3–6pm, soccer practice tonight, etc." />
            </div>
          </div>
        </Section>

        {/* Tasks */}
        <Section title="Your assignments"
          action={
            <Button variant="outline" size="sm" onClick={() => setTasks((a) => [...a, newTask()])}>
              <Plus className="mr-1 h-4 w-4" /> Add task
            </Button>
          }>
          <div className="space-y-3">
            {tasks.map((t, i) => (
              <TaskRow key={t.id} task={t} index={i}
                onChange={(p) => updateTask(t.id, p)} onRemove={() => removeTask(t.id)} />
            ))}
            {tasks.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No tasks yet. Add one to get started.
              </p>
            )}
          </div>
        </Section>

        <div className="flex justify-center">
          <Button size="lg" onClick={run} disabled={loading}
            className="px-8 py-6 text-base font-semibold shadow-md">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {loading ? "Building your recovery plan…" : "Run Recovery Agent"}
          </Button>
        </div>

        {result && (
          <div id="results" className="space-y-6">
            <StrategyDecisionCard agent={result.agent} toolOutput={result.toolOutput} />
            <WorkloadCard toolOutput={result.toolOutput} />
            {result.toolOutput.taskRisks.length > 0 && (
              <TaskRisksCard toolOutput={result.toolOutput} />
            )}
            <BaselineCompareCard
              baseline={result.baseline}
              comparison={result.agent.decision.baselineComparison}
              llmMode={result.agent.decision.strategyMode} />
            <RawTraceCard toolOutput={result.toolOutput} />
          </div>
        )}

        {/* Technical Evidence (collapsible) */}
        <TechnicalEvidence />
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        RecoveryPilot · AI academic recovery planner
      </footer>
    </div>
  );
}

// ---------------- UI primitives ----------------

function Section({
  title, subtitle, icon, action, children,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {icon}{title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function HowStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function DemoButton({
  title, caption, tone, onClick,
}: {
  title: string; caption: string; tone: "success" | "warning" | "danger"; onClick: () => void;
}) {
  const cls = {
    success: "border-success/40 bg-success/5 hover:bg-success/10",
    warning: "border-warning/40 bg-warning/5 hover:bg-warning/10",
    danger: "border-danger/40 bg-danger/5 hover:bg-danger/10",
  }[tone];
  const dot = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${cls}`}>
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </button>
  );
}

function TaskRow({
  task, index, onChange, onRemove,
}: {
  task: Task; index: number; onChange: (p: Partial<Task>) => void; onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Task #{index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div><Label>Task name</Label>
          <Input value={task.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Essay on Hamlet" /></div>
        <div><Label>Course</Label>
          <Input value={task.course} onChange={(e) => onChange({ course: e.target.value })} placeholder="ENG 200" /></div>
        <div><Label>Due date</Label>
          <Input type="datetime-local" value={task.dueAt} onChange={(e) => onChange({ dueAt: e.target.value })} /></div>
        <div><Label>Estimated hours remaining</Label>
          <Input type="number" min={0} step={0.5} value={task.hoursRemaining}
            onChange={(e) => onChange({ hoursRemaining: Number(e.target.value) })} /></div>
        <div><Label>Progress %</Label>
          <Input type="number" min={0} max={100} step={5} value={task.progress}
            onChange={(e) => onChange({ progress: Number(e.target.value) })} /></div>
        <div><Label>Importance</Label>
          <Select value={task.importance} onValueChange={(v) => onChange({ importance: v as Importance })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select></div>
        <div><Label>Difficulty</Label>
          <Select value={task.difficulty} onValueChange={(v) => onChange({ difficulty: v as Difficulty })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select></div>
        <div className="md:col-span-2"><Label>Notes</Label>
          <Textarea rows={2} value={task.notes} onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Anything blocking you, partial progress, etc." /></div>
      </div>
    </div>
  );
}

function modeStyle(mode: StrategyMode) {
  switch (mode) {
    case "SCHEDULE_MODE": return { label: "Schedule mode", cls: "bg-success/10 text-success border-success/30" };
    case "RECOVERY_MODE": return { label: "Recovery mode", cls: "bg-primary/10 text-primary border-primary/30" };
    case "TRIAGE_MODE":   return { label: "Triage mode",   cls: "bg-warning/10 text-warning border-warning/30" };
    case "WARNING_MODE":  return { label: "Warning mode",  cls: "bg-danger/10 text-danger border-danger/30" };
  }
}

function sumPlannedHours(plan: { durationHours?: number }[]): number {
  return plan.reduce((s, p) => s + (typeof p.durationHours === "number" ? p.durationHours : 0), 0);
}

function StrategyDecisionCard({
  agent, toolOutput,
}: { agent: AgentResult; toolOutput: AnalyzeStudentLoadOutput }) {
  const { decision } = agent;
  const m = modeStyle(decision.strategyMode);
  const isLive = agent.source === "live";
  const planned = sumPlannedHours(decision.recoveryPlan);
  const overScheduled = planned > toolOutput.availableHours + 0.05;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Cpu className="h-5 w-5 text-primary" />
          Strategy chosen
        </h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          isLive ? "border-success/30 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"
        }`}>
          {isLive ? "Live Gemini AI" : "Fallback mode"}
        </span>
      </div>

      {!isLive && "error" in agent && agent.error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Fallback mode active</p>
            <p className="text-xs text-warning/90">{agent.error}</p>
          </div>
        </div>
      )}

      <SubBlock title="Why this strategy">
        <p className="text-sm leading-relaxed text-foreground">{decision.reasoning}</p>
      </SubBlock>

      <SubBlock title="Your recovery plan">
        {decision.recoveryPlan.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plan steps returned.</p>
        ) : (
          <>
            <ol className="space-y-2">
              {decision.recoveryPlan.map((p, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-foreground">{p.step}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.task ? `Task: ${p.task}` : ""}
                      {p.task && p.durationHours ? " · " : ""}
                      {p.durationHours ? `${p.durationHours}h` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className={`mt-3 rounded-lg border p-3 text-xs ${
              overScheduled
                ? "border-danger/40 bg-danger/5 text-danger"
                : "border-border bg-muted/30 text-muted-foreground"
            }`}>
              Planned hours: <span className="font-semibold">{planned.toFixed(1)}h</span> / Available hours: <span className="font-semibold">{toolOutput.availableHours.toFixed(1)}h</span>
              {overScheduled && <div className="mt-1 font-semibold">This plan exceeds available time and should be revised.</div>}
            </div>
          </>
        )}
      </SubBlock>

      {decision.notScheduled && decision.notScheduled.length > 0 && (
        <SubBlock title="Not scheduled yet">
          <ul className="space-y-2">
            {decision.notScheduled.map((n, i) => (
              <li key={i} className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                <p className="font-medium text-foreground">{n.task}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.reason}</p>
              </li>
            ))}
          </ul>
        </SubBlock>
      )}

      <SubBlock title="Risk warnings" icon={<ShieldAlert className="h-4 w-4 text-danger" />}>
        {decision.riskWarnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No risks surfaced.</p>
        ) : (
          <ul className="space-y-1">
            {decision.riskWarnings.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /><span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </SubBlock>

      <SubBlock title="Do this first" icon={<CheckCircle2 className="h-4 w-4 text-success" />}>
        <p className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm font-medium text-foreground">
          {decision.firstAction || "—"}
        </p>
      </SubBlock>
    </section>
  );
}

function WorkloadCard({ toolOutput }: { toolOutput: AnalyzeStudentLoadOutput }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <Wrench className="h-4 w-4 text-primary" />
        Workload analysis
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Estimated work" value={`${toolOutput.totalRawHours.toFixed(1)}h`} hint="Sum of your estimates" />
        <Stat label="Adjusted work" value={`${toolOutput.adjustedWorkHours.toFixed(1)}h`} hint="Scaled for difficulty, energy, stress" />
        <Stat label="Available time" value={`${toolOutput.availableHours.toFixed(1)}h`} hint="Today + tomorrow" />
        <Stat label="Capacity ratio" value={toolOutput.capacityRatioRaw === 999 ? "∞" : `${toolOutput.capacityRatioRaw.toFixed(2)}×`} hint="Raw work ÷ available" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Tool recommended mode: <span className="font-semibold text-foreground">{modeStyle(toolOutput.recommendedMode).label}</span>
        {toolOutput.soonestDueLabel && (
          <> · Soonest due: <span className="font-semibold text-foreground">{toolOutput.soonestDueLabel}</span></>
        )}
      </p>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function TaskRisksCard({ toolOutput }: { toolOutput: AnalyzeStudentLoadOutput }) {
  const urgencyCls = (u: string) =>
    u === "critical" ? "border-danger/40 bg-danger/5 text-danger" :
    u === "high" ? "border-warning/40 bg-warning/5 text-warning" :
    u === "medium" ? "border-primary/30 bg-primary/5 text-primary" :
    "border-border bg-muted/30 text-muted-foreground";
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <ShieldAlert className="h-4 w-4 text-danger" />
        Task-level risks
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {toolOutput.taskRisks.map((tr, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{tr.taskName}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${urgencyCls(tr.urgencyLevel)}`}>
                {tr.urgencyLevel}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {tr.reasons.map((r, j) => <li key={j}>• {r}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function BaselineCompareCard({
  baseline, comparison, llmMode,
}: { baseline: BaselineResult; comparison: string; llmMode: StrategyMode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <GitCompare className="h-4 w-4 text-primary" />
        Baseline comparison
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Simple rule: prioritize the task with the soonest due date.
      </p>
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baseline pick</p>
          <p className="mt-1 font-medium text-foreground">{baseline.topTask ?? "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{baseline.reason}</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI agent decision · {modeStyle(llmMode).label}
          </p>
          <p className="mt-1 text-foreground">{comparison || "—"}</p>
        </div>
      </div>
    </section>
  );
}

function RawTraceCard({ toolOutput }: { toolOutput: AnalyzeStudentLoadOutput }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-foreground hover:text-primary">
          View raw tool trace
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Raw output of <code className="rounded bg-muted px-1">analyze_student_load</code>,
          passed into the Gemini prompt alongside the MCP-style tool schema.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Tool schema (name, description, input/output)
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">
{JSON.stringify({ tool: analyzeStudentLoadTool, llmDeclaration: submitStrategyDecisionDeclaration }, null, 2)}
          </pre>
        </details>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed">
{JSON.stringify(toolOutput, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function SubBlock({
  title, icon, children,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}{title}
      </h4>
      {children}
    </div>
  );
}

function TechnicalEvidence() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-4">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Technical evidence</h2>
            <p className="text-xs text-muted-foreground">For instructors and reviewers — architecture, files, prompts, and docs.</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-2 text-sm">
          <Ev label="Custom tool" value={<code className="rounded bg-muted px-1.5 py-0.5">analyze_student_load</code>} />
          <Ev label="Tool schema location" value={<code>src/mcp/mcpToolDefinitions.ts</code>} />
          <Ev label="Tool logic location" value={<code>src/mcp/analyzeStudentLoad.ts</code>} />
          <Ev label="Recovery agent" value={<code>src/agents/recoveryAgent.ts</code>} />
          <Ev label="Strategy modes" value="SCHEDULE_MODE · RECOVERY_MODE · TRIAGE_MODE · WARNING_MODE" />
          <Ev label="Deterministic baseline" value="Earliest-due-date baseline (computeBaseline)" />
          <Ev label="Evaluation scenarios" value="Normal workload · Messy student input · Overload warning case" />
          <Ev label="Prompt documentation" value={<code>docs/PROMPT_EVOLUTION.md</code>} />
          <Ev label="Draft-to-final changes" value={<code>docs/DRAFT_TO_FINAL_CHANGES.md</code>} />
          <p className="pt-2 text-xs text-muted-foreground">
            Note: this is a custom MCP-style (Gemini function-calling) tool schema, not a connection to a full external MCP server.
          </p>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function Ev({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:w-48 sm:shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
