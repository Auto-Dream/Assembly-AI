import { AssemblyStep, ActionType, Direction } from "../../lib/types";
import { getStepColor } from "../../lib/utils";

interface StepCardProps {
  step: AssemblyStep;
  index: number;
  totalSteps: number;
  isActive: boolean;
  onClick: () => void;
}

export default function StepCard({ step, index, totalSteps, isActive, onClick }: StepCardProps) {
  const color = getStepColor(index);
  const progress = ((index + 1) / totalSteps) * 100;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-blue-500/40 bg-slate-900/80 shadow-lg shadow-blue-500/5 scale-[1.01]"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
      }`}
    >
      <div className="h-1 bg-slate-800 relative overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          <div className="shrink-0">
            <StepIllustration step={step} index={index} color={color} isActive={isActive} />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                    style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}
                  >
                    {step.number}
                  </span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Step {step.number} of {totalSteps}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white leading-snug">{step.title}</h3>
              </div>
              <span className="text-xs text-slate-600 tabular-nums whitespace-nowrap mt-1">
                ~{step.duration}s
              </span>
            </div>

            <p className={`text-sm text-slate-300 leading-relaxed ${isActive ? "" : "line-clamp-2"}`}>
              {step.instruction}
            </p>

            {/* Parts involved */}
            {step.parts && step.parts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
                {step.parts.map((part, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
                  >
                    {part}
                  </span>
                ))}
              </div>
            )}

            {/* Tools */}
            {step.tools.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500/70 shrink-0">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                {step.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        {step.warning && (
          <div className="mt-4 flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0 mt-0.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <p className="text-xs text-amber-300/90 leading-relaxed">{step.warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepIllustrationProps {
  step: AssemblyStep;
  index: number;
  color: string;
  isActive: boolean;
}

function StepIllustration({ step, index, color, isActive }: StepIllustrationProps) {
  const actionType = step.actionType || "connect";
  const direction = step.direction || null;
  const parts = step.parts || [];
  const hasTool = step.tools.length > 0;

  return (
    <svg
      width={120}
      height={120}
      viewBox="0 0 120 120"
      className={`rounded-xl border transition-all duration-300 ${
        isActive
          ? "border-slate-700 bg-slate-800/80"
          : "border-slate-800 bg-slate-900/60 group-hover:border-slate-700"
      }`}
    >
      <defs>
        <pattern id={`grid-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.3" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="120" height="120" fill={`url(#grid-${index})`} />

      {/* Action-specific illustration */}
      <ActionIllustration actionType={actionType} color={color} isActive={isActive} hasTool={hasTool} partsCount={parts.length} />

      {/* Direction arrow */}
      <DirectionArrow direction={direction} color={color} />

      {/* Part labels */}
      <PartLabels parts={parts} color={color} actionType={actionType} />

      {/* Tool indicator */}
      {hasTool && <ToolIndicator color={color} tool={step.tools[0]} />}
    </svg>
  );
}

function ActionIllustration({ actionType, color, isActive, hasTool: _ht, partsCount }: { actionType: ActionType; color: string; isActive: boolean; hasTool: boolean; partsCount: number }) {
  const opacity = isActive ? 1 : 0.7;
  const twoPlus = partsCount >= 2;

  switch (actionType) {
    case "connect":
      return (
        <g opacity={opacity}>
          <rect x="20" y="48" width={twoPlus ? 32 : 35} height="24" rx="3" fill={color + "20"} stroke={color} strokeWidth="1.5" />
          <rect x={twoPlus ? 68 : 65} y="48" width={twoPlus ? 32 : 35} height="24" rx="3" fill={color + "20"} stroke={color} strokeWidth="1.5" />
          <circle cx="52" cy="60" r="2.5" fill={color} opacity="0.9" />
          <circle cx="68" cy="60" r="2.5" fill={color} opacity="0.9" />
          <path d="M54.5 60 L65.5 60" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
      );
    case "screw":
      return (
        <g opacity={opacity}>
          <rect x="30" y="55" width="60" height="22" rx="3" fill={color + "15"} stroke={color} strokeWidth="1.5" />
          <circle cx="50" cy="66" r="6" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="50" y1="63" x2="50" y2="69" stroke={color} strokeWidth="1.5" />
          <line x1="47" y1="66" x2="53" y2="66" stroke={color} strokeWidth="1.5" />
          <circle cx="75" cy="66" r="6" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="72" y1="63" x2="78" y2="69" stroke={color} strokeWidth="1.2" />
          <line x1="78" y1="63" x2="72" y2="69" stroke={color} strokeWidth="1.2" />
          {/* Screwdriver hint */}
          <line x1="50" y1="42" x2="50" y2="55" stroke={color} strokeWidth="2" opacity="0.4" />
          <rect x="47" y="38" width="6" height="6" rx="1" fill={color} opacity="0.3" />
        </g>
      );
    case "tighten":
      return (
        <g opacity={opacity}>
          <rect x="35" y="52" width="50" height="26" rx="4" fill={color + "15"} stroke={color} strokeWidth="1.5" />
          <circle cx="60" cy="65" r="8" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="60" cy="65" r="3" fill={color} opacity="0.6" />
          {/* Rotation arcs */}
          <path d="M52 57 A 12 12 0 0 1 68 57" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M66 55 L68 57 L66 59" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M68 73 A 12 12 0 0 1 52 73" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M54 75 L52 73 L54 71" fill="none" stroke={color} strokeWidth="1.5" />
        </g>
      );
    case "insert":
      return (
        <g opacity={opacity}>
          {/* Slot/hole */}
          <rect x="35" y="58" width="50" height="22" rx="4" fill={color + "12"} stroke={color} strokeWidth="1.5" />
          <rect x="50" y="60" width="20" height="8" rx="2" fill={color + "25"} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
          {/* Piece being inserted */}
          <rect x="52" y="36" width="16" height="18" rx="2" fill={color + "30"} stroke={color} strokeWidth="1.5" />
          {/* Motion */}
          <path d="M60 54 L60 58" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M56 56 L60 60 L64 56" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
        </g>
      );
    case "attach":
      return (
        <g opacity={opacity}>
          {/* Main body */}
          <rect x="25" y="50" width="45" height="28" rx="4" fill={color + "18"} stroke={color} strokeWidth="1.5" />
          {/* Attachment piece */}
          <rect x="72" y="54" width="22" height="20" rx="3" fill={color + "25"} stroke={color} strokeWidth="1.5" />
          {/* Connection points */}
          <circle cx="70" cy="60" r="2" fill={color} />
          <circle cx="70" cy="68" r="2" fill={color} />
          <circle cx="72" cy="60" r="2" fill={color} />
          <circle cx="72" cy="68" r="2" fill={color} />
          {/* Arrow showing attachment */}
          <path d="M66 64 L72 64" stroke={color} strokeWidth="1.5" opacity="0.6" />
        </g>
      );
    case "align":
      return (
        <g opacity={opacity}>
          <rect x="30" y="45" width="25" height="30" rx="3" fill={color + "20"} stroke={color} strokeWidth="1.5" />
          <rect x="65" y="45" width="25" height="30" rx="3" fill={color + "20"} stroke={color} strokeWidth="1.5" />
          {/* Alignment guides */}
          <line x1="42" y1="38" x2="42" y2="82" stroke={color} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
          <line x1="77" y1="38" x2="77" y2="82" stroke={color} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
          <line x1="25" y1="60" x2="95" y2="60" stroke={color} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
          {/* Alignment markers */}
          <circle cx="42" cy="60" r="2.5" fill={color} opacity="0.7" />
          <circle cx="77" cy="60" r="2.5" fill={color} opacity="0.7" />
        </g>
      );
    case "rotate":
      return (
        <g opacity={opacity}>
          <rect x="40" y="40" width="40" height="40" rx="5" fill={color + "15"} stroke={color} strokeWidth="1.5" />
          <circle cx="60" cy="60" r="4" fill={color} opacity="0.5" />
          {/* Large rotation arc */}
          <path d="M45 48 A 20 20 0 0 1 75 48" fill="none" stroke={color} strokeWidth="2" />
          <path d="M72 45 L75 48 L72 51" fill="none" stroke={color} strokeWidth="2" />
          {/* Degree marks */}
          <line x1="60" y1="38" x2="60" y2="42" stroke={color} strokeWidth="1" opacity="0.4" />
          <line x1="82" y1="60" x2="78" y2="60" stroke={color} strokeWidth="1" opacity="0.4" />
        </g>
      );
    case "lift":
      return (
        <g opacity={opacity}>
          {/* Surface */}
          <rect x="25" y="68" width="70" height="12" rx="3" fill={color + "12"} stroke={color} strokeWidth="1" opacity="0.5" />
          {/* Object being lifted */}
          <rect x="40" y="42" width="40" height="20" rx="4" fill={color + "25"} stroke={color} strokeWidth="1.5" />
          {/* Lift arrows */}
          <path d="M50 68 L50 62" stroke={color} strokeWidth="1.5" opacity="0.7" />
          <path d="M47 64 L50 62 L53 64" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
          <path d="M70 68 L70 62" stroke={color} strokeWidth="1.5" opacity="0.7" />
          <path d="M67 64 L70 62 L73 64" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
          {/* Hands hint */}
          <path d="M38 48 L40 48" stroke={color} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
          <path d="M80 48 L82 48" stroke={color} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case "place":
      return (
        <g opacity={opacity}>
          {/* Target area (dashed outline) */}
          <rect x="30" y="60" width="60" height="24" rx="4" fill={color + "08"} stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Object being placed */}
          <rect x="40" y="36" width="40" height="18" rx="3" fill={color + "25"} stroke={color} strokeWidth="1.5" />
          {/* Drop motion */}
          <path d="M60 54 L60 60" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
          <path d="M56 57 L60 60 L64 57" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
          {/* Position markers on target */}
          <circle cx="40" cy="72" r="1.5" fill={color} opacity="0.4" />
          <circle cx="80" cy="72" r="1.5" fill={color} opacity="0.4" />
        </g>
      );
    default:
      return (
        <g opacity={opacity}>
          <rect x="35" y="45" width="50" height="30" rx="4" fill={color + "15"} stroke={color} strokeWidth="1.5" />
          <circle cx="60" cy="60" r="5" fill={color} opacity="0.4" />
        </g>
      );
  }
}

function DirectionArrow({ direction, color }: { direction: Direction; color: string }) {
  if (!direction) return null;

  const arrows: Record<string, JSX.Element> = {
    down: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 25 L100 38 M97 35 L100 38 L103 35" />
      </g>
    ),
    up: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 38 L100 25 M97 28 L100 25 L103 28" />
      </g>
    ),
    left: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M108 20 L95 20 M98 17 L95 20 L98 23" />
      </g>
    ),
    right: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M92 20 L105 20 M102 17 L105 20 L102 23" />
      </g>
    ),
    clockwise: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M95 22 A 8 8 0 1 1 103 28" />
        <path d="M101 26 L103 28 L105 26" />
      </g>
    ),
    counterclockwise: (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M105 22 A 8 8 0 1 0 97 28" />
        <path d="M99 26 L97 28 L95 26" />
      </g>
    ),
  };

  return arrows[direction] || null;
}

function PartLabels({ parts, color, actionType }: { parts: string[]; color: string; actionType: ActionType }) {
  if (!parts || parts.length === 0) return null;

  const labelPositions = getPartLabelPositions(actionType, parts.length);

  return (
    <g>
      {parts.slice(0, 2).map((part, i) => {
        const pos = labelPositions[i];
        if (!pos) return null;
        const label = part.length > 10 ? part.slice(0, 9) + ".." : part;
        return (
          <g key={i}>
            <rect
              x={pos.x - 2}
              y={pos.y - 7}
              width={label.length * 4.5 + 6}
              height="11"
              rx="2"
              fill="#0f172a"
              stroke={color}
              strokeWidth="0.5"
              opacity="0.85"
            />
            <text
              x={pos.x + 1}
              y={pos.y}
              fontSize="7"
              fill={color}
              fontFamily="system-ui, sans-serif"
              opacity="0.9"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function getPartLabelPositions(actionType: ActionType, count: number): { x: number; y: number }[] {
  if (count === 0) return [];
  if (count === 1) {
    switch (actionType) {
      case "insert": return [{ x: 10, y: 100 }];
      case "lift": return [{ x: 10, y: 100 }];
      default: return [{ x: 10, y: 100 }];
    }
  }
  switch (actionType) {
    case "connect": return [{ x: 8, y: 100 }, { x: 65, y: 100 }];
    case "attach": return [{ x: 8, y: 100 }, { x: 65, y: 100 }];
    case "align": return [{ x: 8, y: 100 }, { x: 62, y: 100 }];
    default: return [{ x: 8, y: 100 }, { x: 8, y: 112 }];
  }
}

function ToolIndicator({ color, tool }: { color: string; tool: string }) {
  const label = tool.length > 8 ? tool.slice(0, 7) + ".." : tool;
  return (
    <g>
      <rect x="4" y="4" width={label.length * 5 + 16} height="14" rx="3" fill="#0f172a" stroke={color} strokeWidth="0.6" opacity="0.9" />
      {/* Wrench icon mini */}
      <path d="M8 8 L8 14 L10 14 L10 10 L12 10 L12 8 Z" fill={color} opacity="0.6" />
      <text x="15" y="14" fontSize="7" fill={color} fontFamily="system-ui, sans-serif" opacity="0.8">{label}</text>
    </g>
  );
}
