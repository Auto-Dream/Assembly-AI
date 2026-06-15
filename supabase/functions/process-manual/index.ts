import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "process-manual";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  zh: "Chinese (Simplified)", ja: "Japanese", pt: "Portuguese",
  it: "Italian", ko: "Korean", ar: "Arabic",
};

type ActionType = "connect" | "screw" | "align" | "insert" | "attach" | "rotate" | "lift" | "place" | "tighten";
type Direction = "down" | "up" | "left" | "right" | "clockwise" | "counterclockwise" | null;

interface Step {
  number: number;
  title: string;
  instruction: string;
  duration: number;
  tools: string[];
  warning: string | null;
  actionType: ActionType;
  parts: string[];
  direction: Direction;
  hardware?: { name: string; count: number }[];
  stuckHint?: string | null;
}

const VALID_ACTIONS: ActionType[] = ["connect", "screw", "align", "insert", "attach", "rotate", "lift", "place", "tighten"];
const VALID_DIRECTIONS = ["down", "up", "left", "right", "clockwise", "counterclockwise"];

function inferActionType(step: Record<string, unknown>): ActionType {
  const text = `${step.title || ""} ${step.instruction || ""}`.toLowerCase();
  if (/screw|bolt|fasten/.test(text)) return "screw";
  if (/tighten|torque|secure/.test(text)) return "tighten";
  if (/insert|push in|slide in/.test(text)) return "insert";
  if (/connect|join|link|combine/.test(text)) return "connect";
  if (/attach|mount|fix/.test(text)) return "attach";
  if (/align|line up|center|position/.test(text)) return "align";
  if (/rotate|turn|twist|spin/.test(text)) return "rotate";
  if (/lift|raise|pick up/.test(text)) return "lift";
  if (/place|put|set|lay/.test(text)) return "place";
  return "connect";
}

// ---- Shared Gemini call helper ----
async function callGemini(apiKey: string, parts: unknown[], opts: { json: boolean; maxTokens?: number }) {
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: opts.maxTokens ?? 8192,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let rawBody = "";
  try { rawBody = await res.text(); } catch { rawBody = "(unreadable)"; }
  return { res, rawBody };
}

function buildMediaPart(imageData: string, mimeType: string): unknown {
  // PDFs and images both go through inlineData; Gemini 2.5 Flash accepts application/pdf.
  return { inlineData: { data: imageData, mimeType: mimeType || "image/jpeg" } };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const { imageData, mimeType, language = "en", mode = "extract", question, context } = body;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return json({ success: false, error: "GEMINI_API_KEY secret is not set. Please add it in your Supabase project secrets.", function: FUNCTION_NAME });
    }

    const langName = LANGUAGE_NAMES[language] || "English";

    // =========================================================
    // MODE: ask  — grounded Q&A about the scanned product
    // =========================================================
    if (mode === "ask") {
      if (!question || typeof question !== "string") {
        return json({ success: false, error: "A 'question' is required for ask mode.", function: FUNCTION_NAME });
      }

      const askPrompt = `You are a helpful product assistant. The user has scanned a product's label, manual, or instructions (provided as an image${context ? " — additional extracted context is included below" : ""}).

Answer the user's question using ONLY information that is actually present in the image${context ? " or the provided context" : ""}.

Critical rules:
- If the answer is shown, give it clearly and practically, in ${langName}.
- If the information is NOT present, reply exactly: "The instructions don't show that." (translated to ${langName}) — then, if helpful, add one short sentence of general safe guidance clearly labeled as general advice, not from the label.
- Never invent product-specific facts (doses, settings, safety claims, compatibility) that are not visible.
- Be concise. No preamble.

${context ? `CONTEXT (already extracted from this product):\n${context}\n\n` : ""}User question: ${question}`;

      const parts: unknown[] = [];
      if (imageData) parts.push(buildMediaPart(imageData, mimeType));
      parts.push({ text: askPrompt });

      const { res, rawBody } = await callGemini(apiKey, parts, { json: false, maxTokens: 1024 });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(rawBody)?.error?.message || msg; } catch { msg = rawBody.slice(0, 300) || msg; }
        return json({ success: false, geminiStatus: res.status, error: msg, function: FUNCTION_NAME });
      }
      let answer = "";
      try {
        const parsed = JSON.parse(rawBody);
        answer = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      } catch { answer = ""; }
      if (!answer) return json({ success: false, error: "Empty response from AI", function: FUNCTION_NAME });

      return json({ success: true, mode: "ask", answer: answer.trim(), language, function: FUNCTION_NAME });
    }

    // =========================================================
    // MODE: extract (default) — guided furniture-assembly build
    // =========================================================
    const prompt = `You are an expert furniture-assembly guide. The user is about to assemble a piece of furniture and has scanned its instruction manual (which may be MULTIPLE pages in a PDF, or one or more photos). Your job is to turn it into a clear, confidence-building, step-by-step build they can follow hands-on — NOT a summary.

Read ALL pages/images. Extract the full assembly sequence in order.

Respond ONLY with valid JSON in this exact format — no markdown, no code fences, just raw JSON:
{
  "title": "What is being built (e.g. 'BILLY Bookcase')",
  "interpretation": "2-3 sentences: what they're building, roughly how long/how hard, and the single most important thing to get right or the most common mistake.",
  "toolsNeeded": ["screwdriver", "hammer"],
  "hardwareSummary": [{"name": "wooden dowel", "count": 8}, {"name": "cam lock", "count": 6}],
  "steps": [
    {
      "number": 1,
      "title": "Step title (max 6 words)",
      "instruction": "Clear hands-on instruction for THIS step, phrased as guidance (1-2 sentences).",
      "duration": 60,
      "tools": ["screwdriver"],
      "hardware": [{"name": "dowel", "count": 4}],
      "parts": ["side panel", "top panel"],
      "warning": "Common mistake or caution for this step, or null",
      "stuckHint": "If the user gets stuck on THIS step, the most likely problem and how to check/fix it",
      "actionType": "insert",
      "direction": "down"
    }
  ]
}

Rules:
- Extract EVERY real assembly step in order (furniture builds are often 6-20+ steps). Do not collapse or pad.
- instruction = practical guidance ("Insert the 4 dowels into the pre-drilled holes on the side panel"), not a transcription.
- hardware = the specific fasteners used in that step with counts, when shown. Empty array if none.
- parts = the named panels/pieces involved in that step (1-3).
- warning = a real common mistake or safety note (e.g. "Make sure the pre-drilled holes face inward"), else null.
- stuckHint = anticipate the #1 confusion on this step (e.g. "If the panel won't sit flush, a dowel may not be fully seated — tap it in"). This is what we show when they tap 'I'm stuck'.
- toolsNeeded = all tools needed across the whole build. hardwareSummary = total count of each fastener type.
- duration = estimated seconds for the step.
- actionType MUST be one of: ${VALID_ACTIONS.join(", ")}.
- direction = primary motion or null.
- All text in ${langName}.
- If the images are clearly NOT a furniture manual, still produce your best step list from what's shown, and note it in interpretation.`;

    const parts: unknown[] = [];
    if (imageData) parts.push(buildMediaPart(imageData, mimeType));
    parts.push({ text: prompt });

    const { res, rawBody } = await callGemini(apiKey, parts, { json: true });
    console.log(`[${FUNCTION_NAME}] Gemini HTTP ${res.status}`);

    if (!res.ok) {
      let geminiMessage = `HTTP ${res.status}`;
      try { geminiMessage = JSON.parse(rawBody)?.error?.message || geminiMessage; }
      catch { geminiMessage = rawBody.slice(0, 300) || geminiMessage; }
      return json({ success: false, geminiStatus: res.status, geminiMessage, error: geminiMessage, function: FUNCTION_NAME });
    }

    let geminiParsed: Record<string, unknown>;
    try { geminiParsed = JSON.parse(rawBody); }
    catch { return json({ success: false, error: "Gemini returned non-JSON response", function: FUNCTION_NAME }); }

    const rawText: string =
      (geminiParsed as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
        ?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) return json({ success: false, error: "Gemini returned empty response", function: FUNCTION_NAME });

    function extractJson(text: string): unknown | null {
      try { return JSON.parse(text); } catch { /* continue */ }
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) { try { return JSON.parse(fenceMatch[1]); } catch { /* continue */ } }
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch { /* continue */ }
      }
      return null;
    }

    function buildFallbackFromRawText(text: string): { title: string; interpretation: string; steps: Step[] } {
      const lines = text.split(/\n/).filter(l => l.trim().length > 0);
      const interpretation = lines.slice(0, 2).join(" ").slice(0, 200);
      const stepLines = lines.filter(l => /^\s*(\d+[\.\):]|\-|\*)\s/.test(l));
      const steps: Step[] = (stepLines.length > 0 ? stepLines : lines.slice(0, 6)).map((line, i) => {
        const instruction = line.replace(/^\s*(\d+[\.\):]|\-|\*)\s*/, "").trim();
        return {
          number: i + 1, title: `Step ${i + 1}`, instruction, duration: 5, tools: [],
          warning: null, actionType: inferActionType({ instruction }), parts: [], direction: null,
        };
      });
      return { title: "Product Guide", interpretation, steps: steps.slice(0, 12) };
    }

    let analysisResult: { title: string; interpretation: string; steps: Step[] };
    const parsed = extractJson(rawText);
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).steps)) {
      analysisResult = parsed as { title: string; interpretation: string; steps: Step[] };
    } else {
      console.warn(`[${FUNCTION_NAME}] JSON parse failed, using fallback.`);
      analysisResult = buildFallbackFromRawText(rawText);
    }

    const { title, interpretation, steps } = analysisResult;

    if (!Array.isArray(steps) || steps.length === 0) {
      return json({
        success: true, title: "Product Guide", interpretation: rawText.slice(0, 300), language,
        steps: [{ number: 1, title: "Review Instructions", instruction: rawText.slice(0, 500), duration: 10, tools: [], warning: null, actionType: "place", parts: [], direction: null }],
        isDemo: false, isFallback: true, function: FUNCTION_NAME,
      });
    }

    const normalizedSteps: Step[] = steps.map((s, i) => ({
      number: typeof s.number === "number" ? s.number : i + 1,
      title: String(s.title || `Step ${i + 1}`),
      instruction: String(s.instruction || ""),
      duration: typeof s.duration === "number" ? Math.max(2, Math.min(600, s.duration)) : 60,
      tools: Array.isArray(s.tools) ? s.tools.map(String) : [],
      warning: s.warning ? String(s.warning) : null,
      actionType: VALID_ACTIONS.includes(s.actionType) ? s.actionType : inferActionType(s),
      parts: Array.isArray(s.parts) ? s.parts.map(String).slice(0, 3) : [],
      direction: VALID_DIRECTIONS.includes(s.direction as string) ? s.direction as Direction : null,
      hardware: Array.isArray(s.hardware)
        ? s.hardware
            .filter((h) => h && typeof h === "object")
            .map((h) => ({ name: String((h as { name?: unknown }).name ?? ""), count: Number((h as { count?: unknown }).count) || 1 }))
            .slice(0, 6)
        : [],
      stuckHint: s.stuckHint ? String(s.stuckHint) : null,
    }));

    const toolsNeeded = Array.isArray((analysisResult as { toolsNeeded?: unknown }).toolsNeeded)
      ? ((analysisResult as { toolsNeeded: unknown[] }).toolsNeeded).map(String)
      : [];
    const hardwareSummary = Array.isArray((analysisResult as { hardwareSummary?: unknown }).hardwareSummary)
      ? ((analysisResult as { hardwareSummary: unknown[] }).hardwareSummary)
          .filter((h) => h && typeof h === "object")
          .map((h) => ({ name: String((h as { name?: unknown }).name ?? ""), count: Number((h as { count?: unknown }).count) || 1 }))
      : [];

    return json({
      success: true,
      title: String(title || "Assembly Guide"),
      interpretation: String(interpretation || ""),
      language,
      steps: normalizedSteps,
      toolsNeeded,
      hardwareSummary,
      promptUsed: prompt,
      isDemo: false,
      function: FUNCTION_NAME,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${FUNCTION_NAME}] Unhandled exception: ${message}`);
    return json({ success: false, error: message, function: FUNCTION_NAME }, 500);
  }
});
