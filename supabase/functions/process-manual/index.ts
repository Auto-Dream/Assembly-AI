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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const { imageData, mimeType, language = "en" } = body;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY secret is not set. Please add it in your Supabase project secrets.",
          function: FUNCTION_NAME,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langName = LANGUAGE_NAMES[language] || "English";
    console.log(`[${FUNCTION_NAME}] language=${language} (${langName}), imageData=${!!imageData}, mimeType=${mimeType}`);

    const prompt = `You are an expert at analyzing assembly manuals and instruction documents.

Analyze the provided image (an assembly manual, instruction sheet, or similar document) and extract structured step-by-step assembly instructions with visual metadata for generating IKEA-style illustration diagrams.

Respond ONLY with valid JSON in this exact format — no markdown, no code fences, just raw JSON:
{
  "title": "Short descriptive title of the assembly task (in ${langName})",
  "interpretation": "2-3 sentence summary of what this manual is for and what the user will build/assemble (in ${langName})",
  "steps": [
    {
      "number": 1,
      "title": "Step title (in ${langName}, max 6 words)",
      "instruction": "Clear instruction for this step (in ${langName}, 1-2 sentences)",
      "duration": 4,
      "tools": ["tool1"],
      "warning": null,
      "actionType": "connect",
      "parts": ["part A", "part B"],
      "direction": "down"
    }
  ]
}

Rules:
- Extract between 4 and 12 steps
- duration is estimated seconds (3-10 per step)
- tools is an array of strings, empty array [] if none needed
- warning is a string for safety notes or null if none
- actionType MUST be one of: "connect", "screw", "align", "insert", "attach", "rotate", "lift", "place", "tighten"
- parts is an array of short part names involved in this step (1-3 items, e.g. ["side panel", "shelf"])
- direction is the primary motion direction: "down", "up", "left", "right", "clockwise", "counterclockwise", or null if no clear direction
- All text must be in ${langName}
- If the image is not a manual, create generic reasonable steps based on what you see`;

    const parts: unknown[] = [];

    if (imageData) {
      parts.push({ inlineData: { data: imageData, mimeType: mimeType || "image/jpeg" } });
    }
    parts.push({ text: prompt });

    const geminiBody = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    let rawBody = "";
    try { rawBody = await res.text(); } catch { rawBody = "(unreadable)"; }

    console.log(`[${FUNCTION_NAME}] Gemini HTTP ${res.status}`);

    if (!res.ok) {
      let geminiMessage = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(rawBody);
        geminiMessage = parsed?.error?.message || geminiMessage;
      } catch { geminiMessage = rawBody.slice(0, 300) || geminiMessage; }

      return new Response(
        JSON.stringify({
          success: false,
          geminiStatus: res.status,
          geminiMessage,
          error: geminiMessage,
          function: FUNCTION_NAME,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let geminiParsed: Record<string, unknown>;
    try {
      geminiParsed = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini returned non-JSON response", function: FUNCTION_NAME }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawText: string =
      (geminiParsed as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
        ?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini returned empty response", function: FUNCTION_NAME }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${FUNCTION_NAME}] Raw Gemini text (first 300): ${rawText.slice(0, 300)}`);

    // Robust JSON extraction with fallback
    function extractJson(text: string): unknown | null {
      // Try direct parse first
      try { return JSON.parse(text); } catch { /* continue */ }

      // Strip markdown code fences
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) {
        try { return JSON.parse(fenceMatch[1]); } catch { /* continue */ }
      }

      // Find the first { ... } block
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch { /* continue */ }
      }

      return null;
    }

    function buildFallbackFromRawText(text: string): { title: string; interpretation: string; steps: Step[] } {
      const lines = text.split(/\n/).filter(l => l.trim().length > 0);
      const title = "Assembly Guide";
      const interpretation = lines.slice(0, 2).join(" ").slice(0, 200);
      const stepLines = lines.filter(l => /^\s*(\d+[\.\):]|\-|\*)\s/.test(l));
      const steps: Step[] = (stepLines.length > 0 ? stepLines : lines.slice(0, 6)).map((line, i) => {
        const instruction = line.replace(/^\s*(\d+[\.\):]|\-|\*)\s*/, "").trim();
        const fakeStep = { title: "", instruction };
        return {
          number: i + 1,
          title: `Step ${i + 1}`,
          instruction,
          duration: 5,
          tools: [],
          warning: null,
          actionType: inferActionType(fakeStep),
          parts: [],
          direction: null,
        };
      });
      return { title, interpretation, steps: steps.slice(0, 12) };
    }

    let analysisResult: { title: string; interpretation: string; steps: Step[] };
    const parsed = extractJson(rawText);

    if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).steps)) {
      analysisResult = parsed as { title: string; interpretation: string; steps: Step[] };
    } else {
      console.warn(`[${FUNCTION_NAME}] JSON parse failed, using fallback. Raw: ${rawText.slice(0, 300)}`);
      analysisResult = buildFallbackFromRawText(rawText);
    }

    const { title, interpretation, steps } = analysisResult;

    if (!Array.isArray(steps) || steps.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          title: "Assembly Guide",
          interpretation: rawText.slice(0, 300),
          language,
          steps: [{ number: 1, title: "Review Manual", instruction: rawText.slice(0, 500), duration: 10, tools: [], warning: null, actionType: "place", parts: [], direction: null }],
          isDemo: false,
          isFallback: true,
          function: FUNCTION_NAME,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedSteps: Step[] = steps.map((s, i) => ({
      number: typeof s.number === "number" ? s.number : i + 1,
      title: String(s.title || `Step ${i + 1}`),
      instruction: String(s.instruction || ""),
      duration: typeof s.duration === "number" ? Math.max(2, Math.min(15, s.duration)) : 5,
      tools: Array.isArray(s.tools) ? s.tools.map(String) : [],
      warning: s.warning ? String(s.warning) : null,
      actionType: VALID_ACTIONS.includes(s.actionType) ? s.actionType : inferActionType(s),
      parts: Array.isArray(s.parts) ? s.parts.map(String).slice(0, 3) : [],
      direction: VALID_DIRECTIONS.includes(s.direction) ? s.direction as Direction : null,
    }));

    console.log(`[${FUNCTION_NAME}] Extracted ${normalizedSteps.length} steps for "${title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        title: String(title || "Assembly Guide"),
        interpretation: String(interpretation || ""),
        language,
        steps: normalizedSteps,
        promptUsed: prompt,
        isDemo: false,
        function: FUNCTION_NAME,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${FUNCTION_NAME}] Unhandled exception: ${message}`);
    return new Response(
      JSON.stringify({ success: false, error: message, function: FUNCTION_NAME }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
