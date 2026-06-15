import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Wrench, Package, AlertTriangle,
  LifeBuoy, CheckCircle2, PartyPopper, X,
} from "lucide-react";
import { AssemblyStep } from "../lib/types";
import { getStepColor } from "../lib/utils";
import AskProduct from "./AskProduct";

interface GuideModeProps {
  steps: AssemblyStep[];
  language: string;
  title: string;
  interpretation: string;
  imageData?: string;
  mimeType?: string;
}

export default function GuideMode({ steps, language, title, interpretation, imageData, mimeType }: GuideModeProps) {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [stuckOpen, setStuckOpen] = useState(false);

  const total = steps.length;
  const step = steps[current];
  const color = getStepColor(current);
  const isLast = current === total - 1;
  const completedCount = done.size;

  const go = (i: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, i)));
    setStuckOpen(false);
  };

  const markDoneAndNext = () => {
    setDone((d) => new Set(d).add(current));
    if (!isLast) go(current + 1);
  };

  if (!step) return null;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">
            Step {current + 1} of {total}
          </span>
          <span className="text-xs text-slate-500">{completedCount} done</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / total) * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Big step card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: color + "22", color, border: `2px solid ${color}55` }}
          >
            {step.number}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{step.title}</h2>
          </div>
        </div>

        <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-6">{step.instruction}</p>

        {/* Parts / Tools / Hardware for THIS step */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {step.parts && step.parts.length > 0 && (
            <InfoChip icon={<Package size={14} />} label="Parts" items={step.parts} />
          )}
          {step.tools && step.tools.length > 0 && (
            <InfoChip icon={<Wrench size={14} />} label="Tools" items={step.tools} />
          )}
          {step.hardware && step.hardware.length > 0 && (
            <InfoChip
              icon={<CheckCircle2 size={14} />}
              label="Hardware"
              items={step.hardware.map((h) => `${h.count}× ${h.name}`)}
            />
          )}
        </div>

        {/* Warning */}
        {step.warning && (
          <div className="flex gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200 leading-relaxed">{step.warning}</p>
          </div>
        )}

        {/* I'm stuck */}
        <button
          onClick={() => setStuckOpen((v) => !v)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            stuckOpen
              ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {stuckOpen ? <X size={16} /> : <LifeBuoy size={16} />}
          {stuckOpen ? "Close help" : "I'm stuck on this step"}
        </button>

        {stuckOpen && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {step.stuckHint && (
              <div className="flex gap-2.5 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <LifeBuoy size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-cyan-300 mb-1">Most common issue here</p>
                  <p className="text-sm text-cyan-100/90 leading-relaxed">{step.stuckHint}</p>
                </div>
              </div>
            )}
            <AskProduct
              imageData={imageData}
              mimeType={mimeType}
              language={language}
              title={title}
              interpretation={interpretation}
              stepContext={`The user is on step ${step.number} of ${total}: "${step.title}" — ${step.instruction}`}
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} /> Back
        </button>

        {isLast ? (
          <button
            onClick={() => setDone((d) => new Set(d).add(current))}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold transition-all"
          >
            <PartyPopper size={18} /> Finish — I'm done!
          </button>
        ) : (
          <button
            onClick={markDoneAndNext}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
            style={{ background: `linear-gradient(to right, ${color}, ${color}cc)` }}
          >
            Done — Next step <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to step ${i + 1}`}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              backgroundColor: i === current ? getStepColor(i) : done.has(i) ? getStepColor(i) + "66" : "#334155",
              transform: i === current ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function InfoChip({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
        {icon} {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span key={i} className="text-xs text-slate-200 bg-slate-900/60 rounded-md px-2 py-0.5">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
