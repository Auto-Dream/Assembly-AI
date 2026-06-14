import { useState, useCallback } from "react";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import CameraCapture from "./components/CameraCapture";
import ProcessingView from "./components/ProcessingView";
import ResultsView from "./components/ResultsView";
import SessionHistory from "./components/SessionHistory";
import LanguageSelector from "./components/LanguageSelector";
import ErrorBanner from "./components/ErrorBanner";
import { AppView, ProcessResult, Session, AssemblyStep } from "./lib/types";
import { fileToBase64 } from "./lib/utils";
import { supabase } from "./lib/supabase";
import { Camera, Wand2, History } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [showCamera, setShowCamera] = useState(false);
  const [language, setLanguage] = useState("en");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionRefresh, setSessionRefresh] = useState(0);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setView("processing");
    setProcessingProgress(10);

    let imageBase64 = "";
    try {
      // Both images AND PDFs are sent to the AI (Gemini accepts application/pdf inline).
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        imageBase64 = await fileToBase64(file);
      }
      setProcessingProgress(30);
    } catch {
      setError("Failed to read the file. Please try again.");
      setView("home");
      return;
    }

    const progressTimer = setInterval(() => {
      setProcessingProgress((p) => Math.min(p + 3, 72));
    }, 200);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ imageData: imageBase64, mimeType: file.type, language }),
      });

      clearInterval(progressTimer);

      const data = await response.json().catch(() => ({ success: false, error: "Invalid response from server" }));

      if (!data.success) {
        const detail = data.geminiMessage || data.error || "Analysis failed";
        const status = data.geminiStatus ? ` (HTTP ${data.geminiStatus})` : "";
        throw new Error(`${detail}${status}`);
      }

      setProcessingProgress(90);
      await new Promise((r) => setTimeout(r, 400));
      setProcessingProgress(100);
      await new Promise((r) => setTimeout(r, 250));

      const processResult: ProcessResult = {
        title: data.title,
        language: data.language,
        interpretation: data.interpretation,
        steps: data.steps,
        promptUsed: data.promptUsed || "",
        isDemo: false,
        imageData: imageBase64,
        mimeType: file.type,
      };

      try {
        await supabase.from("sessions").insert({
          title: data.title,
          language: data.language,
          interpretation: data.interpretation,
          steps: data.steps,
          prompt_used: data.promptUsed || "",
          thumbnail_data: "",
        });
        setSessionRefresh((n) => n + 1);
      } catch {
        // non-fatal
      }

      setResult(processResult);
      setView("results");
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
      setView("home");
    }
  }, [language]);

  const handleFile = useCallback((file: File) => setPendingFile(file), []);

  const handleCameraCapture = useCallback((file: File) => {
    setShowCamera(false);
    setPendingFile(file);
  }, []);

  const handleReplay = (session: Session) => {
    setResult({
      title: session.title,
      language: session.language,
      interpretation: session.interpretation,
      steps: (Array.isArray(session.steps) ? session.steps : []) as AssemblyStep[],
      promptUsed: session.prompt_used,
      isDemo: false,
    });
    setView("results");
  };

  const handleReset = () => {
    setPendingFile(null);
    setResult(null);
    setError(null);
    setView("home");
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header onLogoClick={handleReset} />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      {view === "processing" && (
        <ProcessingView progress={processingProgress} language={language} />
      )}

      {view === "home" && (
        <main className="pt-16 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center mb-10 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                AI-Powered Manual Converter
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Turn Any Manual Into
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Step-by-Step Guide
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Upload or scan an assembly manual and get an interactive animated guide with AI-extracted steps.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Upload Manual</h2>
                    <LanguageSelector value={language} onChange={setLanguage} />
                  </div>

                  <UploadZone onFile={handleFile} />

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-xs text-slate-600">or capture</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <button
                    onClick={() => setShowCamera(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-400 hover:text-blue-400 transition-all duration-200 group"
                  >
                    <Camera size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Scan with Camera</span>
                  </button>

                  {pendingFile && (
                    <div className="animate-slide-up">
                      <button
                        onClick={() => processFile(pendingFile)}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.01]"
                      >
                        <Wand2 size={17} />
                        Generate Step-by-Step Guide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <History size={15} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-white">Recent Guides</h3>
                  </div>
                  <SessionHistory onReplay={handleReplay} refreshTrigger={sessionRefresh} />
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === "results" && result && (
        <ResultsView result={result} onBack={handleReset} />
      )}
    </div>
  );
}
