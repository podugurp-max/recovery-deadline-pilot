import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LlmReviewResponse } from "@/lib/reviewer.functions";

export function LlmReviewerOutput({
  state,
}: {
  state: { status: "loading" } | { status: "done"; result: LlmReviewResponse };
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        LLM Reviewer Agent Output
      </h3>

      {state.status === "loading" && (
        <p className="text-sm text-muted-foreground">
          Calling Gemini to audit the deterministic recovery plan…
        </p>
      )}

      {state.status === "done" && !state.result.ok && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-foreground">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" />
            LLM Reviewer unavailable. Showing deterministic reviewer result.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{state.result.error}</p>
        </div>
      )}

      {state.status === "done" && state.result.ok && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Gemini call succeeded
            </Badge>
            <Badge
              className={
                state.result.review.reviewerStatus === "Approved"
                  ? "bg-success text-success-foreground"
                  : "bg-danger text-danger-foreground"
              }
            >
              {state.result.review.reviewerStatus}
            </Badge>
          </div>

          <Field label="Reviewer summary" value={state.result.review.reviewerSummary} />
          <Field
            label="False reassurance check"
            value={state.result.review.falseReassuranceCheck}
          />

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Concerns
            </p>
            {state.result.review.concerns.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-1">
                {state.result.review.concerns.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-2 text-sm"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested fixes
            </p>
            {state.result.review.suggestedFixes.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                {state.result.review.suggestedFixes.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}
