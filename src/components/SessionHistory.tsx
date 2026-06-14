import { useEffect, useState } from "react";
import { History, Play, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Session } from "../lib/types";

interface SessionHistoryProps {
  onReplay: (session: Session) => void;
  refreshTrigger: number;
}

const LANG_FLAGS: Record<string, string> = {
  en: "EN", es: "ES", fr: "FR", de: "DE", zh: "ZH",
  ja: "JA", pt: "PT", it: "IT", ko: "KO", ar: "AR",
};

export default function SessionHistory({ onReplay, refreshTrigger }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      setSessions((data as Session[]) || []);
      setLoading(false);
    }
    load();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="text-slate-600 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <History size={18} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">No guides yet</p>
        <p className="text-xs text-slate-600 mt-0.5">Upload a manual to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const date = new Date(session.created_at);
        const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const stepsArr = Array.isArray(session.steps) ? session.steps : [];

        return (
          <button
            key={session.id}
            onClick={() => onReplay(session)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-blue-500/30 hover:bg-slate-800 transition-all group text-left"
          >
            {/* Thumbnail / icon */}
            <div className="w-12 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              {session.thumbnail_data ? (
                <img
                  src={`data:image/jpeg;base64,${session.thumbnail_data}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Play size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                {session.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-600">{dateStr}</span>
                <span className="w-px h-2.5 bg-slate-700" />
                <span className="text-[10px] text-slate-600">{stepsArr.length} steps</span>
                <span className="w-px h-2.5 bg-slate-700" />
                <span className="text-[10px] text-blue-500/70 font-medium">
                  {LANG_FLAGS[session.language] || session.language.toUpperCase()}
                </span>
              </div>
            </div>

            <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-400 transition-colors shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
