import { useEffect, useState } from "react";
import { Cpu, Sparkles } from "lucide-react";
import { LANGUAGES } from "../lib/types";

interface ProcessingViewProps {
  progress: number;
  language: string;
}

export default function ProcessingView({ progress, language }: ProcessingViewProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  const langName = LANGUAGES.find((l) => l.code === language)?.name ?? language.toUpperCase();

  const label =
    progress < 40 ? "Analyzing manual" :
    progress < 80 ? "Extracting steps" :
    "Building guide";

  const steps = [
    { threshold: 0, text: "Reading your manual" },
    { threshold: 35, text: "Identifying assembly steps" },
    { threshold: 70, text: "Structuring your guide" },
    { threshold: 88, text: "Almost done" },
  ];
  const currentStep = [...steps].reverse().find((s) => progress >= s.threshold) ?? steps[0];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Cpu size={34} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
            <Sparkles size={10} className="text-slate-900" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{label}{dots}</h2>
          <p className="text-slate-500 text-sm mt-1.5">{currentStep.text}</p>
          {language !== "en" && (
            <p className="text-xs text-blue-400/70 mt-1">Responding in {langName}</p>
          )}
        </div>

        <div className="w-full">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Gemini analysis</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
