import { useState } from "react";
import { ArrowLeft, Brain, ChevronDown, Wrench, Package } from "lucide-react";
import { ProcessResult } from "../lib/types";
import { getTotalDuration } from "../lib/utils";
import GuideMode from "./GuideMode";

interface ResultsViewProps {
  result: ProcessResult;
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 90) return `~${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}

export default function ResultsView({ result, onBack }: ResultsViewProps) {
  const [showOverview, setShowOverview] = useState(true);

  const steps = Array.isArray(result.steps) ? result.steps : [];
  const totalDuration = getTotalDuration(steps);
  const tools = result.toolsNeeded && result.toolsNeeded.length > 0
    ? result.toolsNeeded
    : [...new Set(steps.flatMap((s) => (Array.isArray(s.tools) ? s.tools : [])))];
  const hardware = result.hardwareSummary || [];

  // Defensive: if the backend returned nothing usable, show a clear message instead of a blank screen.
  if (steps.length === 0) {
    return (
      <main className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm transition-all mb-6"
          >
            <ArrowLeft size={15} /> New
          </button>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">{result.title || "Couldn't read the manual"}</h2>
            <p className="text-sm text-slate-400">
              {result.interpretation || "We couldn't extract clear steps from that image. Try a clearer photo, a different page, or upload the full PDF manual."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5 animate-fade-in">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm transition-all shrink-0 mt-0.5"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">New</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">{result.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
              <span>{steps.length} steps</span>
              <span className="text-slate-700">&middot;</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* Before you start — overview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden mb-4 animate-slide-up">
          <button
            onClick={() => setShowOverview((v) => !v)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Brain size={14} className="text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-white">Before you start</span>
            </div>
            <ChevronDown size={15} className={`text-slate-500 transition-transform shrink-0 ${showOverview ? "rotate-180" : ""}`} />
          </button>
          {showOverview && (
            <div className="px-4 sm:px-5 pb-5 space-y-4 animate-fade-in">
              {result.interpretation && (
                <p className="text-sm text-slate-300 leading-relaxed">{result.interpretation}</p>
              )}
              {tools.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                    <Wrench size={13} /> Tools you'll need
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tools.map((t, i) => (
                      <span key={i} className="text-xs text-slate-200 bg-slate-800 rounded-lg px-2.5 py-1">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {hardware.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                    <Package size={13} /> Hardware (check you have it all)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hardware.map((h, i) => (
                      <span key={i} className="text-xs text-slate-200 bg-slate-800 rounded-lg px-2.5 py-1">
                        <span className="font-semibold text-white">{h.count}×</span> {h.name}{h.ref ? <span className="text-slate-500"> ({h.ref})</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* THE GUIDE — primary experience */}
        <GuideMode
          steps={steps}
          language={result.language}
          title={result.title}
          interpretation={result.interpretation}
          imageData={result.imageData}
          mimeType={result.mimeType}
        />

      </div>
    </main>
  );
}
