import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PlanInput = z.object({
  summary: z.string(),
  feasibility: z.string(),
  requiredHours: z.number(),
  rawRequiredHours: z.number().optional(),
  availableHours: z.number(),
  workloadRatio: z.number(),
  firstNextAction: z.string(),
  missingInfo: z.array(z.string()),
  incompleteAssignments: z
    .array(z.object({ displayName: z.string(), reasons: z.array(z.string()) }))
    .optional(),
  deterministicReviewer: z.string().optional(),
  risks: z.array(z.string()),
  ranking: z.array(
    z.object({
      name: z.string(),
      course: z.string(),
      difficulty: z.string(),
      progress: z.number(),
      hoursUntilDue: z.number(),
      dueLabel: z.string().optional(),
      hoursRemaining: z.number(),
      weight: z.number(),
      isIncomplete: z.boolean().optional(),
    }),
  ),
  plan: z.array(
    z.object({
      assignmentName: z.string(),
      block: z.string(),
      hoursAllocated: z.number(),
      note: z.string(),
    }),
  ),
});

export type LlmReview = {
  reviewerStatus: "Approved" | "Needs Revision";
  reviewerSummary: string;
  falseReassuranceCheck: string;
  concerns: string[];
  suggestedFixes: string[];
};

export type LlmReviewResponse =
  | { ok: true; review: LlmReview }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are the Reviewer Agent in an agentic academic deadline recovery system for overwhelmed college students.

You audit a deterministic recovery plan produced by upstream agents (Task Parser, Priority, Feasibility, Schedule Builder, Risk). Your job is to check:
- realism of the plan
- missing information that would change the recommendation
- false reassurance (claiming everything is fine when workload exceeds available time)
- whether overloaded workloads are handled with triage instead of denial
- whether the plan actually fits available time
- whether the first next action is appropriate and concrete
- whether the final output should be Approved or Needs Revision

Be strict. If workloadRatio > 1.15 and the plan does not explicitly triage (partial/defer), that is false reassurance and must be flagged.

Respond ONLY by calling the provided "submit_review" function with structured JSON. Do not include any other text.`;

export const reviewPlanWithGemini = createServerFn({ method: "POST" })
  .inputValidator((data) => PlanInput.parse(data))
  .handler(async ({ data }): Promise<LlmReviewResponse> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "GEMINI_API_KEY is not configured on the server." };
    }

    const userContent = `Audit this recovery plan and return structured JSON via the submit_review function.\n\nPLAN JSON:\n${JSON.stringify(data, null, 2)}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      tools: [
        {
          functionDeclarations: [
            {
              name: "submit_review",
              description: "Submit the structured reviewer audit of the recovery plan.",
              parameters: {
                type: "OBJECT",
                properties: {
                  reviewerStatus: {
                    type: "STRING",
                    enum: ["Approved", "Needs Revision"],
                  },
                  reviewerSummary: { type: "STRING" },
                  falseReassuranceCheck: { type: "STRING" },
                  concerns: { type: "ARRAY", items: { type: "STRING" } },
                  suggestedFixes: { type: "ARRAY", items: { type: "STRING" } },
                },
                required: [
                  "reviewerStatus",
                  "reviewerSummary",
                  "falseReassuranceCheck",
                  "concerns",
                  "suggestedFixes",
                ],
              },
            },
          ],
        },
      ],
      toolConfig: {
        functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_review"] },
      },
    };

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Gemini API error:", resp.status, text);
        return { ok: false, error: `Gemini API error ${resp.status}` };
      }

      const json = (await resp.json()) as any;
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const fn = parts.find((p: any) => p.functionCall)?.functionCall;
      if (!fn?.args) {
        return { ok: false, error: "Gemini returned no structured function call." };
      }
      const args = fn.args as LlmReview;
      // Light shape guard
      if (args.reviewerStatus !== "Approved" && args.reviewerStatus !== "Needs Revision") {
        return { ok: false, error: "Invalid reviewerStatus from Gemini." };
      }
      return {
        ok: true,
        review: {
          reviewerStatus: args.reviewerStatus,
          reviewerSummary: String(args.reviewerSummary ?? ""),
          falseReassuranceCheck: String(args.falseReassuranceCheck ?? ""),
          concerns: Array.isArray(args.concerns) ? args.concerns.map(String) : [],
          suggestedFixes: Array.isArray(args.suggestedFixes)
            ? args.suggestedFixes.map(String)
            : [],
        },
      };
    } catch (e) {
      console.error("Gemini call failed:", e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error calling Gemini.",
      };
    }
  });
