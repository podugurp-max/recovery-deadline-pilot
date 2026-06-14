// RecoveryPilot LLM agent.
// -------------------------------------------------------------
// This server function:
//   1. Receives the student context, tasks, deterministic baseline,
//      and the output already produced by the custom MCP-style tool
//      `analyze_student_load`.
//   2. Defines the MCP-style tool schema in the prompt so the LLM
//      can see how the tool produces its facts.
//   3. Asks Gemini to AUTONOMOUSLY choose one strategy mode
//      (SCHEDULE_MODE / RECOVERY_MODE / TRIAGE_MODE / WARNING_MODE)
//      and explain its decision via the `submit_strategy_decision`
//      function call.
//   4. If GEMINI_API_KEY is missing or the call fails, returns a
//      clearly-labeled fallback decision derived from the tool's
//      recommendedMode. The UI must distinguish live vs fallback.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  analyzeStudentLoadTool,
  submitStrategyDecisionDeclaration,
} from "@/mcp/mcpToolDefinitions";
import type {
  AgentResult,
  AnalyzeStudentLoadOutput,
  BaselineResult,
  StrategyDecision,
  StrategyMode,
} from "@/types/recovery";

const Input = z.object({
  context: z.any(),
  tasks: z.array(z.any()),
  toolOutput: z.any(),
  baseline: z.object({ topTask: z.string().nullable(), reason: z.string() }),
});

const SYSTEM_PROMPT = `You are RecoveryPilot, an academic recovery agent for overwhelmed college students.

A custom MCP-style tool named "analyze_student_load" has ALREADY been called for you. Its structured output is included in the user message. You must use that output as ground-truth facts.

You then autonomously choose ONE strategy mode:
- SCHEDULE_MODE: the student has enough time; build a normal schedule.
- RECOVERY_MODE: the student is somewhat behind; build a focused recovery plan that catches up the most important work.
- TRIAGE_MODE: the student is overloaded; prioritize only the highest-impact work and defer or drop the rest.
- WARNING_MODE: the workload is unrealistic; warn the student plainly and recommend scope reduction, extensions, or asking for help. Do NOT pretend a normal schedule will work.

Hard rules:
- Refuse false reassurance. If capacityRatio > 1.5, you may not promise the student can finish everything.
- If risk flags include "likely unachievable" or "already past due", you must surface that explicitly.
- You are not bound to the tool's recommendedMode — you may override it, but if you do, explain why.
- Compare your decision to the deterministic baseline (earliest-due-date-first) in the baselineComparison field. Explain meaningfully where you agree or diverge.
- Keep the recoveryPlan concrete and short (3–6 steps).

Respond ONLY by calling the submit_strategy_decision function.`;

function fallbackDecision(
  toolOutput: AnalyzeStudentLoadOutput,
  baseline: BaselineResult,
): StrategyDecision {
  const mode: StrategyMode = toolOutput.recommendedMode;
  return {
    strategyMode: mode,
    reasoning:
      `Fallback mode (no live LLM). Using the deterministic MCP tool's recommendedMode based on a capacity ratio of ${toolOutput.capacityRatio}. ` +
      `${toolOutput.highRiskTaskCount} high-risk task(s) detected.`,
    recoveryPlan: [
      {
        step: "Start the highest-importance, lowest-progress task in a focused block.",
        durationHours: Math.min(2, Math.max(0.5, toolOutput.availableHours / 2)),
      },
      { step: "Take a 10-minute reset, then reassess remaining time before continuing." },
      mode === "WARNING_MODE" || mode === "TRIAGE_MODE"
        ? {
            step: "Email instructor(s) of the most at-risk task to request an extension or partial-credit option.",
          }
        : { step: "Continue with the next-highest-impact task." },
    ],
    riskWarnings: toolOutput.riskFlags.length
      ? toolOutput.riskFlags
      : ["No critical risks detected by the tool."],
    firstAction: baseline.topTask
      ? `Open "${baseline.topTask}" and work for one focused block, but reassess after 45 minutes.`
      : "Pick the single most important task and start a focused 45-minute block.",
    baselineComparison: baseline.topTask
      ? `Baseline (earliest due) would start with "${baseline.topTask}". Fallback agent recommends ${mode} based on capacity ratio ${toolOutput.capacityRatio}, which considers more than due date alone.`
      : `Baseline could not pick a task (no usable due dates). Fallback agent recommends ${mode}.`,
  };
}

export const runRecoveryAgent = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<AgentResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    const toolOutput = data.toolOutput as AnalyzeStudentLoadOutput;
    const baseline = data.baseline as BaselineResult;

    if (!apiKey) {
      return {
        ok: true,
        source: "fallback",
        decision: fallbackDecision(toolOutput, baseline),
        error: "GEMINI_API_KEY not configured — running fallback decision.",
      };
    }

    const userText =
      `STUDENT CONTEXT:\n${JSON.stringify(data.context, null, 2)}\n\n` +
      `TASKS:\n${JSON.stringify(data.tasks, null, 2)}\n\n` +
      `CUSTOM MCP-STYLE TOOL DEFINITION (exposed to you):\n${JSON.stringify(analyzeStudentLoadTool, null, 2)}\n\n` +
      `CUSTOM MCP-STYLE TOOL OUTPUT (already executed for you):\n${JSON.stringify(toolOutput, null, 2)}\n\n` +
      `DETERMINISTIC BASELINE (earliest-due-date-first):\n${JSON.stringify(baseline, null, 2)}\n\n` +
      `Choose ONE strategy mode autonomously. Call submit_strategy_decision with your reasoning, recovery plan, risk warnings, first action, and a meaningful comparison to the baseline.`;

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: userText }] }],
            tools: [{ functionDeclarations: [submitStrategyDecisionDeclaration] }],
            toolConfig: {
              functionCallingConfig: {
                mode: "ANY",
                allowedFunctionNames: ["submit_strategy_decision"],
              },
            },
          }),
        },
      );

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Gemini API error:", resp.status, text);
        return {
          ok: false,
          source: "fallback",
          decision: fallbackDecision(toolOutput, baseline),
          error: `Gemini API ${resp.status}: ${text.slice(0, 240)}`,
        };
      }

      const json = (await resp.json()) as any;
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const fn = parts.find((p: any) => p.functionCall)?.functionCall;
      if (!fn?.args) {
        return {
          ok: false,
          source: "fallback",
          decision: fallbackDecision(toolOutput, baseline),
          error: "Gemini returned no structured submit_strategy_decision call.",
        };
      }

      const a = fn.args as Partial<StrategyDecision>;
      const validModes: StrategyMode[] = [
        "SCHEDULE_MODE",
        "RECOVERY_MODE",
        "TRIAGE_MODE",
        "WARNING_MODE",
      ];
      if (!a.strategyMode || !validModes.includes(a.strategyMode)) {
        return {
          ok: false,
          source: "fallback",
          decision: fallbackDecision(toolOutput, baseline),
          error: `Invalid strategyMode from Gemini: ${a.strategyMode}`,
        };
      }

      return {
        ok: true,
        source: "live",
        decision: {
          strategyMode: a.strategyMode,
          reasoning: String(a.reasoning ?? ""),
          recoveryPlan: Array.isArray(a.recoveryPlan)
            ? a.recoveryPlan.map((p: any) => ({
                step: String(p?.step ?? ""),
                task: p?.task ? String(p.task) : undefined,
                durationHours:
                  typeof p?.durationHours === "number" ? p.durationHours : undefined,
              }))
            : [],
          riskWarnings: Array.isArray(a.riskWarnings) ? a.riskWarnings.map(String) : [],
          firstAction: String(a.firstAction ?? ""),
          baselineComparison: String(a.baselineComparison ?? ""),
        },
      };
    } catch (e) {
      console.error("Gemini call failed:", e);
      return {
        ok: false,
        source: "fallback",
        decision: fallbackDecision(toolOutput, baseline),
        error: e instanceof Error ? e.message : "Unknown error calling Gemini.",
      };
    }
  });
