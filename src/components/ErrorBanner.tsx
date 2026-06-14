import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-down">
      <div className="flex items-start gap-3 bg-red-950/90 border border-red-800/60 rounded-xl p-4 shadow-2xl backdrop-blur-md">
        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-red-200 flex-1">{message}</p>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
