import { useState, lazy, Suspense } from "react";
import {
  ArrowLeft, Brain, ChevronDown, CheckCircle2, Clock, Box,
} from "lucide-react";
import { ProcessResult } from "../lib/types";
import { getTotalDuration, getStepColor } from "../lib/utils";
import StepCard from "./AssemblyGuide/StepCard";
import AskProduct from "./AskProduct";

const AssemblyViewer3D = lazy(() => import("./AssemblyViewer3D"));

interface ResultsViewProps {
  result: ProcessResult;
  onBack: () => void;
}

export default function ResultsView({ result, onBack }: ResultsViewProps) {
  const [showInterpretation, setShowInterpretation] = useState(true);
  const [show3D, setShow3D] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const totalDuration = getTotalDuration(result.steps);
  const totalTools = [...new Set(result.steps.flatMap((s) => s.tools))];

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5 sm:mb-6 animate-fade-in">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm transition-all shrink-0 mt-0.5"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">New Guide</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white leading-snug">{result.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CheckCircle2 size={10} className="text-emerald-500" />
                {result.steps.length} steps
              </span>
              <span className="text-slate-700">&middot;</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={10} className="text-blue-400" />
                ~{totalDuration}s
              </span>
              {totalTools.length > 0 && (
                <>
                  <span className="text-slate-700">&middot;</span>
                  <span className="text-xs text-slate-500">
                    Tools: {totalTools.join(", ")}
                  </span>
                </>
              )}
              <span className="text-slate-700">&middot;</span>
              <span className="text-xs text-slate-500 uppercase">{result.language}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5 animate-slide-up">

          {/* Ask about this product — the primary interaction */}
          <AskProduct
            imageData={result.imageData}
            mimeType={result.mimeType}
            language={result.language}
            interpretation={result.interpretation}
            title={result.title}
          />

          {/* AI Interpretation */}
          {result.interpretation && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowInterpretation((v) => !v)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Brain size={14} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">What this is</span>
                </div>
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 shrink-0 ${showInterpretation ? "rotate-180" : ""}`}
                />
              </button>
              {showInterpretation && (
                <div className="px-4 sm:px-5 pb-5 animate-fade-in">
                  <p className="text-sm text-slate-300 leading-relaxed">{result.interpretation}</p>
                </div>
              )}
            </div>
          )}

          {/* 3D Assembly Viewer — collapsed by default (optional visual aid) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
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
              <ChevronDown
                size={15}
                className={`text-slate-500 transition-transform duration-200 shrink-0 ${show3D ? "rotate-180" : ""}`}
              />
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

          {/* Step-by-step cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Step-by-Step Instructions</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Prev
                </button>
                <span className="text-xs text-slate-500 tabular-nums min-w-[40px] text-center">
                  {activeStep + 1}/{result.steps.length}
                </span>
                <button
                  onClick={() => setActiveStep(Math.min(result.steps.length - 1, activeStep + 1))}
                  disabled={activeStep === result.steps.length - 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
              {result.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold transition-all"
                  style={i === activeStep ? {
                    backgroundColor: getStepColor(i) + "25",
                    color: getStepColor(i),
                    border: `1.5px solid ${getStepColor(i)}50`,
                  } : i < activeStep ? {
                    backgroundColor: getStepColor(i) + "10",
                    color: getStepColor(i),
                    border: `1px solid ${getStepColor(i)}20`,
                    opacity: 0.6,
                  } : {
                    backgroundColor: "transparent",
                    color: "#475569",
                    border: "1px solid #334155",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {result.steps.map((step, i) => (
                <StepCard
                  key={step.number}
                  step={step}
                  index={i}
                  totalSteps={result.steps.length}
                  isActive={activeStep === i}
                  onClick={() => setActiveStep(i)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
