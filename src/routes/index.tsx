import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Play, GraduationCap, Workflow, FlaskConical } from "lucide-react";
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
import { AssignmentCard } from "@/components/AssignmentCard";
import { RecoveryOutput } from "@/components/RecoveryOutput";
import { AgentTraceView } from "@/components/AgentTraceView";
import { LlmReviewerOutput } from "@/components/LlmReviewerOutput";
import {
  runRecovery,
  type Assignment,
  type Energy,
  type RecoveryPlan,
  type StudentContext,
} from "@/lib/recovery-engine";
import {
  reviewPlanWithGemini,
  type LlmReviewResponse,
} from "@/lib/reviewer.functions";
import {
  normalWorkloadTest,
  messyInputTest,
  overloadFailureTest,
  type TestFixture,
} from "@/lib/test-fixtures";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeadlinePilot — Academic Deadline Recovery Assistant" },
      {
        name: "description",
        content:
          "Agentic academic triage that helps overwhelmed students prioritize assignments, check feasibility, and build a realistic recovery plan.",
      },
      { property: "og:title", content: "DeadlinePilot" },
      {
        property: "og:description",
        content: "Agentic academic triage for deadline overload.",
      },
    ],
  }),
  component: DeadlinePilot,
});

const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const newAssignment = (): Assignment => ({
  id: crypto.randomUUID(),
  name: "",
  course: "",
  dueAt: "",
  hoursRemaining: 1,
  weight: 10,
  progress: 0,
  difficulty: "medium",
  notes: "",
});

function DeadlinePilot() {
  const [ctx, setCtx] = useState<StudentContext>({
    currentDate: todayLocal(),
    hoursToday: 3,
    hoursTomorrow: 5,
    energy: "medium",
    stress: "medium",
    fixedCommitments: "",
  });

  const [assignments, setAssignments] = useState<Assignment[]>([newAssignment()]);
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [llmReview, setLlmReview] = useState<
    { status: "loading" } | { status: "done"; result: LlmReviewResponse } | null
  >(null);

  const reviewFn = useServerFn(reviewPlanWithGemini);

  const update = <K extends keyof StudentContext>(k: K, v: StudentContext[K]) =>
    setCtx((c) => ({ ...c, [k]: v }));

  const run = async () => {
    const ctxIso: StudentContext = {
      ...ctx,
      currentDate: new Date(ctx.currentDate + "T00:00:00").toISOString(),
    };
    const deterministic = runRecovery(ctxIso, assignments);

    // Update Reviewer trace entry to reflect live Gemini call.
    const tracedPlan: RecoveryPlan = {
      ...deterministic,
      trace: deterministic.trace.map((t) =>
        t.agent === "Reviewer Agent"
          ? {
              ...t,
              output: "Called a live Gemini model to audit the deterministic recovery plan.",
            }
          : t,
      ),
    };
    setPlan(tracedPlan);
    setLlmReview({ status: "loading" });
    setTimeout(() => {
      document
        .getElementById("recovery-output")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    try {
      const result = await reviewFn({
        data: {
          summary: tracedPlan.summary,
          feasibility: tracedPlan.feasibility,
          requiredHours: tracedPlan.requiredHours,
          availableHours: tracedPlan.availableHours,
          workloadRatio: isFinite(tracedPlan.workloadRatio)
            ? tracedPlan.workloadRatio
            : 999,
          firstNextAction: tracedPlan.firstNextAction,
          missingInfo: tracedPlan.missingInfo,
          risks: tracedPlan.risks,
          ranking: tracedPlan.ranking.map((r) => ({
            name: r.name,
            course: r.course,
            difficulty: r.difficulty,
            progress: r.progress,
            hoursUntilDue: r.hoursUntilDue,
            hoursRemaining: r.hoursRemaining,
            weight: r.weight,
          })),
          plan: tracedPlan.plan.map((p) => ({
            assignmentName: p.assignmentName,
            block: p.block,
            hoursAllocated: p.hoursAllocated,
            note: p.note,
          })),
        },
      });
      setLlmReview({ status: "done", result });
    } catch (e) {
      setLlmReview({
        status: "done",
        result: {
          ok: false,
          error: e instanceof Error ? e.message : "Network error calling reviewer.",
        },
      });
    }
  };

  const loadFixture = (f: TestFixture) => {
    setCtx(f.context);
    // Clone assignments with fresh ids
    setAssignments(f.assignments.map((a) => ({ ...a, id: crypto.randomUUID() })));
    setPlan(null);
    setLlmReview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-6 sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              DeadlinePilot
            </h1>
            <p className="text-sm text-muted-foreground">
              Agentic academic triage for deadline overload
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* About the Agentic Workflow */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Workflow className="h-5 w-5 text-primary" />
            About the Agentic Workflow
          </h2>
          <p className="text-sm text-muted-foreground">
            DeadlinePilot uses an{" "}
            <span className="font-medium text-foreground">orchestrator-style workflow</span>{" "}
            where a controller routes the student's input through a sequence of specialized
            agents. Each agent owns one narrow responsibility, and a final reviewer audits
            the combined output before it is shown — so the system can refuse false
            reassurance when the workload is unrealistic.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Task Parser Agent", "Normalizes raw assignment input into structured tasks."],
              ["Priority Agent", "Scores tasks by urgency, weight, progress, and difficulty."],
              ["Feasibility Agent", "Compares required vs available hours; sets status."],
              ["Schedule Builder Agent", "Allocates time blocks across today and tomorrow."],
              ["Risk Agent", "Flags procrastination, low-energy, and deadline risks."],
              ["Reviewer Agent", "Audits the plan; approves or sends back for revision."],
            ].map(([name, desc]) => (
              <div
                key={name}
                className="rounded-lg border border-border bg-muted/40 p-3"
              >
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Evaluation Demo */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FlaskConical className="h-5 w-5 text-primary" />
            Evaluation Demo
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Load synthetic test cases to evaluate the agent across three scenarios. After
            loading, click <span className="font-medium">Run Recovery Plan</span> to see the
            agent's response.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TestButton
              tone="success"
              title="Load Normal Workload Test"
              caption="Manageable schedule — expect approval."
              onClick={() => loadFixture(normalWorkloadTest)}
            />
            <TestButton
              tone="warning"
              title="Load Messy Input Test"
              caption="Missing fields — expect reviewer revision."
              onClick={() => loadFixture(messyInputTest)}
            />
            <TestButton
              tone="danger"
              title="Load Overload Failure Test"
              caption="Required ≫ available — agent must triage, not reassure."
              onClick={() => loadFixture(overloadFailureTest)}
            />
          </div>
        </section>

        {/* Student context */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Student context</h2>
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
              <Label htmlFor="today">Hours available today</Label>
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
              <Label htmlFor="tomorrow">Hours available tomorrow</Label>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
        </section>

        {/* Assignments */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignments((a) => [...a, newAssignment()])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add assignment
            </Button>
          </div>

          <div className="space-y-3">
            {assignments.map((a, i) => (
              <AssignmentCard
                key={a.id}
                index={i}
                assignment={a}
                onChange={(next) =>
                  setAssignments((all) => all.map((x) => (x.id === a.id ? next : x)))
                }
                onRemove={() =>
                  setAssignments((all) => all.filter((x) => x.id !== a.id))
                }
              />
            ))}
            {assignments.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No assignments yet. Add one to get started.
              </p>
            )}
          </div>
        </section>

        {/* Run */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={run}
            className="px-8 py-6 text-base font-semibold shadow-md"
          >
            <Play className="mr-2 h-5 w-5" />
            Run Recovery Plan
          </Button>
        </div>

        {/* Output */}
        {plan && (
          <div id="recovery-output" className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <RecoveryOutput plan={plan} />
              {llmReview && <LlmReviewerOutput state={llmReview} />}
            </div>
            <AgentTraceView trace={plan.trace} />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        DeadlinePilot — deterministic agentic workflow demo
      </footer>
    </div>
  );
}

function TestButton({
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
  const toneClasses = {
    success: "border-success/40 bg-success/5 hover:bg-success/10",
    warning: "border-warning/40 bg-warning/5 hover:bg-warning/10",
    danger: "border-danger/40 bg-danger/5 hover:bg-danger/10",
  }[tone];
  const dotClasses = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${toneClasses}`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </button>
  );
}
