import { useState, lazy, Suspense } from "react";
import { ArrowLeft, Brain, ChevronDown, Wrench, Package, Box } from "lucide-react";
import { ProcessResult } from "../lib/types";
import { getTotalDuration } from "../lib/utils";
import GuideMode from "./GuideMode";

const AssemblyViewer3D = lazy(() => import("./AssemblyViewer3D"));

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
  const [show3D, setShow3D] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const totalDuration = getTotalDuration(result.steps);
  const tools = result.toolsNeeded && result.toolsNeeded.length > 0
    ? result.toolsNeeded
    : [...new Set(result.steps.flatMap((s) => s.tools))];
  const hardware = result.hardwareSummary || [];

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
              <span>{result.steps.length} steps</span>
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
                        <span className="font-semibold text-white">{h.count}×</span> {h.name}
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
          steps={result.steps}
          language={result.language}
          title={result.title}
          interpretation={result.interpretation}
          imageData={result.imageData}
          mimeType={result.mimeType}
        />

        {/* Optional 3D motion preview — collapsed */}
        <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShow3D((v) => !v)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
                <Box size={14} className="text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-white">3D motion preview</span>
              <span className="text-xs text-slate-600">(illustrative)</span>
            </div>
            <ChevronDown size={15} className={`text-slate-500 transition-transform shrink-0 ${show3D ? "rotate-180" : ""}`} />
          </button>
          {show3D && (
            <div className="px-3 pb-3 animate-fade-in">
              <Suspense fallback={
                <div className="w-full rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center" style={{ height: "420px" }}>
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Loading 3D viewer...</p>
                  </div>
                </div>
              }>
                <AssemblyViewer3D
                  steps={result.steps}
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                />
              </Suspense>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
