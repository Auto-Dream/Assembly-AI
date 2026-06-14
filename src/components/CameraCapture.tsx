import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera, X, ZoomIn, ZoomOut, RefreshCw, FlipHorizontal,
  Circle, AlertTriangle
} from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [zoom, setZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [pinchStart, setPinchStart] = useState<number | null>(null);
  const [pinchZoomStart, setPinchZoomStart] = useState(1);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;

  const startCamera = useCallback(async () => {
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access and try again.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera: " + err.message);
        }
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const adjustZoom = (delta: number) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStart(dist);
      setPinchZoomStart(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / pinchStart;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchZoomStart * scale)));
    }
  };

  const handleTouchEnd = () => {
    setPinchStart(null);
  };

  const zoomPercent = Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-flash" />}

      {/* Video feed */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <p className="text-red-300 text-sm max-w-sm">{error}</p>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.1s" }}
            />
            {/* Viewfinder */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border border-white/20 rounded-lg">
                {/* Corner marks */}
                {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                  <div
                    key={i}
                    className={`absolute w-6 h-6 ${pos} border-white/70
                      ${i === 0 ? "border-t-2 border-l-2 rounded-tl" : ""}
                      ${i === 1 ? "border-t-2 border-r-2 rounded-tr" : ""}
                      ${i === 2 ? "border-b-2 border-l-2 rounded-bl" : ""}
                      ${i === 3 ? "border-b-2 border-r-2 rounded-br" : ""}
                    `}
                  />
                ))}
              </div>
              {/* Scan line */}
              <div className="absolute inset-x-8 top-8 bottom-8 overflow-hidden rounded-lg pointer-events-none">
                <div className="scan-line" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-950/95 backdrop-blur-md px-4 pt-4 pb-6 flex flex-col gap-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustZoom(-0.5)}
            className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ZoomOut size={16} />
          </button>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={100}
              value={zoomPercent}
              onChange={(e) => {
                const pct = Number(e.target.value) / 100;
                setZoom(MIN_ZOOM + pct * (MAX_ZOOM - MIN_ZOOM));
              }}
              className="w-full h-1 accent-blue-500 cursor-pointer"
            />
          </div>
          <button
            onClick={() => adjustZoom(0.5)}
            className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-right">{zoom.toFixed(1)}x</span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X size={20} />
          </button>

          <button
            onClick={capture}
            disabled={!!error}
            className="w-18 h-18 relative flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-16 h-16 rounded-full border-4 border-white/90 flex items-center justify-center group-hover:border-blue-400 transition-colors">
              <Circle size={44} className="text-white fill-white group-hover:text-blue-300 group-hover:fill-blue-300 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
            className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <FlipHorizontal size={18} />
          </button>
        </div>

        {/* Reset zoom */}
        {zoom > 1 && (
          <button
            onClick={() => setZoom(1)}
            className="flex items-center gap-1.5 mx-auto px-4 py-2.5 min-h-[44px] text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Camera size={13} /> Reset zoom
          </button>
        )}
      </div>
    </div>
  );
}
