import { Cpu, Zap } from "lucide-react";

interface HeaderProps {
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
            <Cpu size={18} className="text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col -space-y-0.5">
            <span className="text-white font-bold text-lg tracking-tight leading-none">
              Assemble<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
            </span>
            <span className="text-slate-500 text-[10px] tracking-widest uppercase leading-none">Manual to Guide</span>
          </div>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap size={12} className="text-cyan-400" />
          <span className="hidden sm:inline">Powered by Gemini</span>
          <span className="sm:hidden">Gemini</span>
        </div>
      </div>
    </header>
  );
}
