import { useState } from "react";
import { ImageOff, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { AssemblyStep } from "../lib/types";

interface StepDiagramProps {
  step: AssemblyStep;
  imageData?: string;  // base64 (no data: prefix) OR full data URL
  mimeType?: string;
}

/**
 * Shows the relevant cropped region of the user's actual manual for this step,
 * with an animated arrow overlaid in the step's motion direction.
 * Uses CSS background-position/size to "crop" via normalized 0-1 coords —
 * no canvas, no extra requests.
 */
export default function StepDiagram({ step, imageData, mimeType }: StepDiagramProps) {
  const [broken, setBroken] = useState(false);

  if (!imageData || broken) {
    return (
      <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center gap-2 py-10 mb-4">
        <ImageOff size={22} className="text-slate-600" />
        <p className="text-xs text-slate-500">Diagram not available for this step</p>
      </div>
    );
  }

  const src = imageData.startsWith("data:")
    ? imageData
    : `data:${mimeType || "image/jpeg"};base64,${imageData}`;

  const crop = step.crop;
  // If we have a valid crop, use background-position math to show just that region.
  // bgSize = 1/w (so the crop fills the box); position = x/(1-w) etc.
  let bgStyle: React.CSSProperties;
  if (crop && crop.w > 0 && crop.h > 0 && (crop.w < 1 || crop.h < 1)) {
    const sizeX = (1 / crop.w) * 100;
    const sizeY = (1 / crop.h) * 100;
    const posX = crop.w < 1 ? (crop.x / (1 - crop.w)) * 100 : 0;
    const posY = crop.h < 1 ? (crop.y / (1 - crop.h)) * 100 : 0;
    bgStyle = {
      backgroundImage: `url("${src}")`,
      backgroundSize: `${sizeX}% ${sizeY}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: "no-repeat",
    };
  } else {
    bgStyle = {
      backgroundImage: `url("${src}")`,
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return (
    <div
      className="relative w-full rounded-xl border border-slate-800 bg-white mb-4 overflow-hidden"
      style={{ aspectRatio: "4 / 3" }}
    >
      {/* hidden img only to detect load failure */}
      <img src={src} alt="" className="hidden" onError={() => setBroken(true)} />
      <div className="absolute inset-0" style={bgStyle} />
      <DirectionArrow direction={step.direction ?? null} />
    </div>
  );
}

function DirectionArrow({ direction }: { direction: string | null }) {
  if (!direction) return null;

  const common = "text-cyan-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]";
  const map: Record<string, { icon: React.ReactNode; anim: string; pos: string }> = {
    down: { icon: <ArrowDown size={40} className={common} />, anim: "animate-bounce", pos: "left-1/2 -translate-x-1/2 top-3" },
    up: { icon: <ArrowUp size={40} className={common} />, anim: "animate-bounce", pos: "left-1/2 -translate-x-1/2 bottom-3" },
    left: { icon: <ArrowLeft size={40} className={common} />, anim: "animate-pulse", pos: "right-3 top-1/2 -translate-y-1/2" },
    right: { icon: <ArrowRight size={40} className={common} />, anim: "animate-pulse", pos: "left-3 top-1/2 -translate-y-1/2" },
    clockwise: { icon: <RotateCw size={40} className={common} />, anim: "animate-spin-slow", pos: "left-1/2 -translate-x-1/2 top-3" },
    counterclockwise: { icon: <RotateCw size={40} className={`${common} -scale-x-100`} />, anim: "animate-spin-slow", pos: "left-1/2 -translate-x-1/2 top-3" },
  };

  const cfg = map[direction];
  if (!cfg) return null;

  return (
    <div className={`absolute ${cfg.pos} ${cfg.anim} pointer-events-none`} aria-hidden>
      {cfg.icon}
    </div>
  );
}
