import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  ListChecks,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { RecoveryPlan, Feasibility } from "@/lib/recovery-engine";

function feasibilityStyles(f: Feasibility) {
  if (f === "manageable")
    return {
      label: "Manageable",
      className: "bg-success text-success-foreground",
      bar: "bg-success",
    };
  if (f === "tight")
    return {
      label: "Tight",
      className: "bg-warning text-warning-foreground",
      bar: "bg-warning",
    };
  return {
    label: "Overloaded",
    className: "bg-danger text-danger-foreground",
    bar: "bg-danger",
  };
}

export function RecoveryOutput({ plan }: { plan: RecoveryPlan }) {
  const f = feasibilityStyles(plan.feasibility);
  const ratioPct = Math.min(200, Math.round(plan.workloadRatio * 100));

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          plan.feasibility === "overloaded"
            ? "border-danger/40 bg-danger/5"
            : plan.feasibility === "tight"
              ? "border-warning/40 bg-warning/5"
              : "border-success/40 bg-success/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Situation summary
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {plan.summary}
            </h3>
          </div>
          <Badge className={`${f.className} px-3 py-1 text-sm`}>{f.label}</Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Metric label="Required" value={`${plan.requiredHours.toFixed(1)}h`} />
          <Metric label="Available" value={`${plan.availableHours.toFixed(1)}h`} />
          <Metric
            label="Workload ratio"
            value={
              isFinite(plan.workloadRatio)
                ? plan.workloadRatio.toFixed(2)
                : "—"
            }
          />
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${f.bar} transition-all`}
              style={{ width: `${Math.min(100, ratioPct)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Thresholds: ≤0.85 manageable · 0.86–1.15 tight · ≥1.16 overloaded
          </p>
        </div>
      </div>

      {/* First next action */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="First next action">
        <p className="text-base font-medium text-foreground">{plan.firstNextAction}</p>
      </Section>

      {/* Priority ranking */}
      <Section icon={<Flag className="h-4 w-4" />} title="Priority ranking">
        <ol className="space-y-2">
          {plan.ranking.map((r, i) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <Badge variant="secondary">{r.course || "—"}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {r.difficulty}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.rationale}</p>
                <div className="mt-2">
                  <Progress value={r.progress} className="h-1.5" />
                </div>
              </div>
            </li>
          ))}
          {plan.ranking.length === 0 && (
            <p className="text-sm text-muted-foreground">No assignments to rank.</p>
          )}
        </ol>
      </Section>

      {/* Recovery plan */}
      <Section icon={<ListChecks className="h-4 w-4" />} title="Recommended recovery plan">
        {plan.plan.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {plan.plan.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{step.assignmentName}</p>
                    <BlockBadge block={step.block} />
                    <span className="text-xs text-muted-foreground">
                      {step.hoursAllocated.toFixed(1)}h
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.note}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Risks */}
      <Section icon={<AlertTriangle className="h-4 w-4" />} title="Risk warnings">
        {plan.risks.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> No major risks detected.
          </p>
        ) : (
          <ul className="space-y-2">
            {plan.risks.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-foreground"
              >
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Missing info */}
      <Section icon={<HelpCircle className="h-4 w-4" />} title="Missing information">
        {plan.missingInfo.length === 0 ? (
          <p className="text-sm text-muted-foreground">All required fields provided.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
            {plan.missingInfo.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Reviewer */}
      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Reviewer check">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              plan.reviewerApproved
                ? "bg-success text-success-foreground"
                : "bg-danger text-danger-foreground"
            }
          >
            {plan.reviewerApproved ? "✓ Plan approved" : "⚠ Needs revision"}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-foreground">{plan.reviewerCheck}</p>
      </Section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function BlockBadge({ block }: { block: string }) {
  const map: Record<string, { label: string; className: string }> = {
    today: { label: "Today", className: "bg-primary text-primary-foreground" },
    tomorrow: { label: "Tomorrow", className: "bg-accent text-accent-foreground" },
    after: { label: "After deadline window", className: "bg-warning text-warning-foreground" },
    "triage-partial": {
      label: "Triage — partial",
      className: "bg-danger text-danger-foreground",
    },
    "triage-defer": {
      label: "Triage — defer / extension",
      className: "bg-danger text-danger-foreground",
    },
  };
  const cfg = map[block] ?? { label: block, className: "bg-muted text-foreground" };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
