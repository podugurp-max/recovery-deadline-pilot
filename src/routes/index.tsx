import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Play,
  Trash2,
  Sparkles,
  Brain,
  Wrench,
  FlaskConical,
  ShieldAlert,
  GitCompare,
  ClipboardList,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { analyzeStudentLoad, computeBaseline } from "@/mcp/analyzeStudentLoad";
import {
  analyzeStudentLoadTool,
  submitStrategyDecisionDeclaration,
} from "@/mcp/mcpToolDefinitions";
import { runRecoveryAgent } from "@/agents/recoveryAgent";
import type {
  AgentResult,
  AnalyzeStudentLoadOutput,
  BaselineResult,
  Energy,
  Importance,
  Difficulty,
  StrategyMode,
  StudentContext,
  Task,
} from "@/types/recovery";
import {
  normalWorkloadDemo,
  messyInputDemo,
  overloadFailureDemo,
  type RecoveryFixture,
} from "@/lib/recovery-fixtures";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecoveryPilot — MCP-powered academic recovery agent" },
      {
        name: "description",
        content:
          "RecoveryPilot is an MCP-powered academic recovery agent for overwhelmed students. A custom MCP-style tool computes workload facts and an LLM autonomously chooses a recovery strategy.",
      },
      { property: "og:title", content: "RecoveryPilot" },
      {
        property: "og:description",
        content:
          "Custom MCP tool + LLM autonomous decision-making for academic recovery.",
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
  name: "",
  course: "",
  dueAt: "",
  hoursRemaining: 1,
  progress: 0,
  importance: "medium",
  difficulty: "medium",
  notes: "",
});

interface RunResult {
  toolOutput: AnalyzeStudentLoadOutput;
  baseline: BaselineResult;
  agent: AgentResult;
}

function RecoveryPilot() {
  const [ctx, setCtx] = useState<StudentContext>({
    currentDate: todayLocal(),
    hoursToday: 3,
    hoursTomorrow: 5,
    energy: "medium",
    stress: "medium",
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

  const removeTask = (id: string) =>
    setTasks((all) => all.filter((t) => t.id !== id));

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

    // 1. Call the custom MCP-style tool (deterministic facts).
    const toolOutput = analyzeStudentLoad({ context: ctxIso, tasks });

    // 2. Compute the simple deterministic baseline for comparison.
    const baseline = computeBaseline(tasks);

    // 3. Hand the tool output to the LLM agent for an autonomous decision.
    try {
      const agent = await runAgent({
        data: { context: ctxIso, tasks, toolOutput, baseline },
      });
      setResult({ toolOutput, baseline, agent });
    } catch (e) {
      setResult({
        toolOutput,
        baseline,
        agent: {
          ok: false,
          source: "fallback",
          error: e instanceof Error ? e.message : "Network error.",
          decision: {
            strategyMode: toolOutput.recommendedMode,
            reasoning:
              "Network error reaching the LLM agent. Falling back to the MCP tool's recommended mode.",
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
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-br from-card to-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                RecoveryPilot
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                MCP-powered academic recovery agent for overwhelmed students
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">
                Project 3 capstone · custom MCP tool + LLM autonomous decision-making
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Architecture Notes */}
        <Section
          icon={<Brain className="h-5 w-5 text-primary" />}
          title="Architecture notes"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            RecoveryPilot evolved from DeadlinePilot. In Project 2, most planning
            agents were deterministic TypeScript functions. In Project 3, the core
            decision has been rebuilt around a{" "}
            <span className="font-medium text-foreground">
              custom MCP-style workload analysis tool
            </span>{" "}
            (<code className="rounded bg-muted px-1 py-0.5 text-xs">analyze_student_load</code>)
            and an{" "}
            <span className="font-medium text-foreground">LLM-powered recovery agent</span>.
            The MCP tool provides structured workload facts, while the LLM
            autonomously chooses the recovery strategy mode and explains its
            reasoning. A simple earliest-due-date baseline is computed for
            comparison.
          </p>
        </Section>

        {/* Demos */}
        <Section
          icon={<FlaskConical className="h-5 w-5 text-primary" />}
          title="Evaluation demos"
          subtitle="Load synthetic scenarios, then click Run Recovery Agent to compare the tool, the LLM, and the baseline."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DemoButton
              tone="success"
              title="Load Normal Workload Demo"
              caption="Manageable schedule · expect SCHEDULE_MODE"
              onClick={() => loadFixture(normalWorkloadDemo)}
            />
            <DemoButton
              tone="warning"
              title="Load Messy Student Input Demo"
              caption="Vague notes, tight time · expect RECOVERY_MODE"
              onClick={() => loadFixture(messyInputDemo)}
            />
            <DemoButton
              tone="danger"
              title="Load Overload Failure Demo"
              caption="Work ≫ time, low energy · expect TRIAGE_MODE or WARNING_MODE"
              onClick={() => loadFixture(overloadFailureDemo)}
            />
          </div>
        </Section>

        {/* Student Context */}
        <Section title="Student context">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="date">Current date</Label>
              <Input
                id="date"
                type="date"
                value={ctx.currentDate}
                onChange={(e) => update("currentDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="today">Available hours today</Label>
              <Input
                id="today"
                type="number"
                min={0}
                step={0.5}
                value={ctx.hoursToday}
                onChange={(e) => update("hoursToday", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="tomorrow">Available hours tomorrow</Label>
              <Input
                id="tomorrow"
                type="number"
                min={0}
                step={0.5}
                value={ctx.hoursTomorrow}
                onChange={(e) => update("hoursTomorrow", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Energy level</Label>
              <Select
                value={ctx.energy}
                onValueChange={(v) => update("energy", v as Energy)}
              >
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
              <Select
                value={ctx.stress}
                onValueChange={(v) => update("stress", v as Energy)}
              >
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
              <Textarea
                id="commitments"
                rows={2}
                value={ctx.fixedCommitments}
                onChange={(e) => update("fixedCommitments", e.target.value)}
                placeholder="Classes, work shift 3–6pm, soccer practice tonight, etc."
              />
            </div>
          </div>
        </Section>

        {/* Academic Tasks */}
        <Section
          title="Academic tasks"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTasks((a) => [...a, newTask()])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add task
            </Button>
          }
        >
          <div className="space-y-3">
            {tasks.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                index={i}
                onChange={(p) => updateTask(t.id, p)}
                onRemove={() => removeTask(t.id)}
              />
            ))}
            {tasks.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No tasks yet. Add one to get started.
              </p>
            )}
          </div>
        </Section>

        {/* Run */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={run}
            disabled={loading}
            className="px-8 py-6 text-base font-semibold shadow-md"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {loading ? "Running recovery agent…" : "Run Recovery Agent"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div id="results" className="space-y-6">
            <StrategyDecisionCard agent={result.agent} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ToolTraceCard toolOutput={result.toolOutput} />
              <BaselineCompareCard
                baseline={result.baseline}
                comparison={result.agent.decision.baselineComparison}
                llmMode={result.agent.decision.strategyMode}
              />
            </div>
          </div>
        )}

        {/* Project 3 Evidence */}
        <Section
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          title="Project 3 evidence"
        >
          <ul className="space-y-2 text-sm text-foreground">
            <EvidenceItem
              label="Custom MCP tool created"
              value={
                <code className="rounded bg-muted px-1.5 py-0.5">analyze_student_load</code>
              }
            />
            <EvidenceItem
              label="Tool exposed to model"
              value="Yes — schema injected into the recovery-agent prompt and the LLM is shown the tool's structured output."
            />
            <EvidenceItem
              label="LLM autonomous decision"
              value="The model selects one of SCHEDULE_MODE / RECOVERY_MODE / TRIAGE_MODE / WARNING_MODE via the submit_strategy_decision function call."
            />
            <EvidenceItem
              label="Deterministic baseline comparison"
              value="Earliest-due-date baseline is computed and shown next to every LLM run."
            />
            <EvidenceItem
              label="Evaluation demos"
              value="Normal Workload · Messy Input · Overload Failure (all selectable above)."
            />
            <EvidenceItem
              label="MCP claim honesty"
              value="This is a custom MCP-style tool implemented in-codebase (not a full external MCP server). Schema lives in src/mcp/mcpToolDefinitions.ts; logic lives in src/mcp/analyzeStudentLoad.ts; LLM wiring lives in src/agents/recoveryAgent.ts."
            />
          </ul>
        </Section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        RecoveryPilot · Project 3 capstone · custom MCP-style tool + Gemini LLM agent
      </footer>
    </div>
  );
}

// ---------------- UI primitives ----------------

function Section({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {icon}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DemoButton({
  title,
  caption,
  tone,
  onClick,
}: {
  title: string;
  caption: string;
  tone: "success" | "warning" | "danger";
  onClick: () => void;
}) {
  const cls = {
    success: "border-success/40 bg-success/5 hover:bg-success/10",
    warning: "border-warning/40 bg-warning/5 hover:bg-warning/10",
    danger: "border-danger/40 bg-danger/5 hover:bg-danger/10",
  }[tone];
  const dot = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${cls}`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </button>
  );
}

function TaskRow({
  task,
  index,
  onChange,
  onRemove,
}: {
  task: Task;
  index: number;
  onChange: (p: Partial<Task>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Task #{index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label>Task name</Label>
          <Input
            value={task.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Essay on Hamlet"
          />
        </div>
        <div>
          <Label>Course</Label>
          <Input
            value={task.course}
            onChange={(e) => onChange({ course: e.target.value })}
            placeholder="ENG 200"
          />
        </div>
        <div>
          <Label>Due date</Label>
          <Input
            type="datetime-local"
            value={task.dueAt}
            onChange={(e) => onChange({ dueAt: e.target.value })}
          />
        </div>
        <div>
          <Label>Estimated hours remaining</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={task.hoursRemaining}
            onChange={(e) => onChange({ hoursRemaining: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Progress %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={5}
            value={task.progress}
            onChange={(e) => onChange({ progress: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Importance</Label>
          <Select
            value={task.importance}
            onValueChange={(v) => onChange({ importance: v as Importance })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select
            value={task.difficulty}
            onValueChange={(v) => onChange({ difficulty: v as Difficulty })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea
            rows={2}
            value={task.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Anything blocking you, partial progress, etc."
          />
        </div>
      </div>
    </div>
  );
}

function modeStyle(mode: StrategyMode) {
  switch (mode) {
    case "SCHEDULE_MODE":
      return { label: "Schedule mode", cls: "bg-success/10 text-success border-success/30" };
    case "RECOVERY_MODE":
      return { label: "Recovery mode", cls: "bg-primary/10 text-primary border-primary/30" };
    case "TRIAGE_MODE":
      return { label: "Triage mode", cls: "bg-warning/10 text-warning border-warning/30" };
    case "WARNING_MODE":
      return { label: "Warning mode", cls: "bg-danger/10 text-danger border-danger/30" };
  }
}

function StrategyDecisionCard({ agent }: { agent: AgentResult }) {
  const { decision } = agent;
  const m = modeStyle(decision.strategyMode);
  const isLive = agent.source === "live";
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Cpu className="h-5 w-5 text-primary" />
          Autonomous strategy decision
        </h2>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}
        >
          {m.label}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isLive
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/40 bg-warning/10 text-warning"
          }`}
        >
          {isLive ? "Live Gemini LLM" : "Fallback (no live LLM)"}
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

      <SubBlock title="Why the model chose this">
        <p className="text-sm leading-relaxed text-foreground">{decision.reasoning}</p>
      </SubBlock>

      <SubBlock title="Recovery plan">
        {decision.recoveryPlan.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plan steps returned.</p>
        ) : (
          <ol className="space-y-2">
            {decision.recoveryPlan.map((p, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
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
        )}
      </SubBlock>

      <SubBlock title="Risk warnings" icon={<ShieldAlert className="h-4 w-4 text-danger" />}>
        {decision.riskWarnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No risks surfaced.</p>
        ) : (
          <ul className="space-y-1">
            {decision.riskWarnings.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </SubBlock>

      <SubBlock title="What the student should do first" icon={<CheckCircle2 className="h-4 w-4 text-success" />}>
        <p className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm font-medium text-foreground">
          {decision.firstAction || "—"}
        </p>
      </SubBlock>
    </section>
  );
}

function ToolTraceCard({ toolOutput }: { toolOutput: AnalyzeStudentLoadOutput }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <Wrench className="h-4 w-4 text-primary" />
        Custom MCP tool trace
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Output of <code className="rounded bg-muted px-1">analyze_student_load</code> —
        passed verbatim into the LLM prompt.
      </p>
      <details className="mb-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          View tool schema (name, description, input/output)
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">
{JSON.stringify(
  { tool: analyzeStudentLoadTool, llmDeclaration: submitStrategyDecisionDeclaration },
  null,
  2,
)}
        </pre>
      </details>
      <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed">
{JSON.stringify(toolOutput, null, 2)}
      </pre>
    </section>
  );
}

function BaselineCompareCard({
  baseline,
  comparison,
  llmMode,
}: {
  baseline: BaselineResult;
  comparison: string;
  llmMode: StrategyMode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <GitCompare className="h-4 w-4 text-primary" />
        Deterministic baseline comparison
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Simple rule: prioritize the task with the soonest due date.
      </p>
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Baseline pick
          </p>
          <p className="mt-1 font-medium text-foreground">
            {baseline.topTask ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{baseline.reason}</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            LLM decision · {modeStyle(llmMode).label}
          </p>
          <p className="mt-1 text-foreground">{comparison || "—"}</p>
        </div>
      </div>
    </section>
  );
}

function SubBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function EvidenceItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:w-56 sm:shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </li>
  );
}
