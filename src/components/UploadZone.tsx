import { useRef, useState, useCallback } from "react";
import { Upload, FileImage, FileText, X, Sparkles } from "lucide-react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_SIZE_MB = 20;

export default function UploadZone({ onFile, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Only images (JPG, PNG, WEBP, GIF) and PDFs are accepted.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File size must be under ${MAX_SIZE_MB}MB.`;
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) { setError(err); return; }
      setError(null);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreview({ url, name: file.name, type: "image" });
      } else {
        setPreview({ url: "", name: file.name, type: "pdf" });
      }
      onFile(file);
    },
    [validate, onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center
            ${dragging ? "border-blue-400 bg-blue-500/10 scale-[1.01]" : "border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/40"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
              ${dragging ? "bg-blue-500/20 scale-110" : "bg-slate-800 group-hover:bg-slate-700"}`}
            >
              <Upload size={28} className={`transition-colors duration-300 ${dragging ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"}`} />
            </div>

            <div>
              <p className="text-base font-medium text-slate-200">
                {dragging ? "Drop to upload" : "Drag & drop your manual"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or <span className="text-blue-400 hover:text-blue-300 transition-colors">browse files</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><FileImage size={11} /> JPG, PNG, WEBP, GIF</span>
              <span className="w-px h-3 bg-slate-700" />
              <span className="flex items-center gap-1"><FileText size={11} /> PDF</span>
              <span className="w-px h-3 bg-slate-700" />
              <span>Max {MAX_SIZE_MB}MB</span>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="relative rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          {preview.type === "image" ? (
            <div className="relative">
              <img
                src={preview.url}
                alt="Preview"
                className="w-full max-h-72 object-contain bg-slate-900"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileImage size={14} className="text-blue-400" />
                  </div>
                  <span className="text-sm text-white font-medium truncate max-w-xs">{preview.name}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <Sparkles size={10} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">Ready</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <FileText size={24} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{preview.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">PDF Document • Ready to process</p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <Sparkles size={10} className="text-emerald-400" />
                <span className="text-xs text-emerald-300">Ready</span>
              </div>
            </div>
          )}
          <button
            onClick={clearPreview}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
}
