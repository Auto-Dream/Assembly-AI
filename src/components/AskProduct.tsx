import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, Send, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface QA {
  question: string;
  answer: string | null;
  error?: boolean;
}

interface AskProductProps {
  imageData?: string;
  mimeType?: string;
  language: string;
  interpretation: string;
  title: string;
  stepContext?: string;
}

const SUGGESTED_GENERAL = [
  "Which parts do I need first?",
  "What tools should I have ready?",
  "What's the most common mistake?",
];

const SUGGESTED_STUCK = [
  "This part won't fit — what's wrong?",
  "I have a leftover piece, is that a problem?",
  "Which way does this piece face?",
];

export default function AskProduct({ imageData, mimeType, language, interpretation, title, stepContext }: AskProductProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setHistory((h) => [...h, { question: q, answer: null }]);
    setLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          mode: "ask",
          question: q,
          imageData,
          mimeType,
          language,
          context: `Product: ${title}. ${interpretation}${stepContext ? "\n" + stepContext : ""}`,
        }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      setHistory((h) => {
        const copy = [...h];
        const last = copy[copy.length - 1];
        if (data.success) { last.answer = data.answer; }
        else { last.answer = data.error || "Couldn't get an answer. Try again."; last.error = true; }
        return copy;
      });
    } catch {
      setHistory((h) => {
        const copy = [...h];
        copy[copy.length - 1].answer = "Network error. Try again.";
        copy[copy.length - 1].error = true;
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4 border-b border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <MessageCircleQuestion size={14} className="text-cyan-400" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">Ask about this product</span>
          <p className="text-xs text-slate-500">Answers come only from what's on the label.</p>
        </div>
      </div>

      {history.length > 0 && (
        <div ref={scrollRef} className="max-h-80 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {history.map((qa, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-blue-600/90 text-white text-sm rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
                  {qa.question}
                </div>
              </div>
              <div className="flex justify-start">
                {qa.answer === null ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm px-1">
                    <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    Checking the label...
                  </div>
                ) : (
                  <div className={`text-sm rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%] flex gap-2 ${qa.error ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-slate-800 text-slate-200"}`}>
                    {qa.error ? <AlertCircle size={15} className="shrink-0 mt-0.5" /> : <Sparkles size={14} className="shrink-0 mt-0.5 text-cyan-400" />}
                    <span className="leading-relaxed whitespace-pre-wrap">{qa.answer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && (
        <div className="px-4 sm:px-5 pt-4 flex flex-wrap gap-2">
          {(stepContext ? SUGGESTED_STUCK : SUGGESTED_GENERAL).map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex items-center gap-2 p-4 sm:p-5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this product..."
          className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
