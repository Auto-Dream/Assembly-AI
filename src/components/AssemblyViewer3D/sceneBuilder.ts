import { AssemblyStep, ActionType } from "../../lib/types";
import * as THREE from "three";

export interface Part3D {
  id: string;
  name: string;
  geometry: "box" | "cylinder" | "sphere" | "rod" | "panel" | "screw" | "connector";
  position: [number, number, number];
  assembledPosition: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  stepIndex: number;
}

export interface Arrow3D {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  stepIndex: number;
}

export interface SceneData {
  parts: Part3D[];
  arrows: Arrow3D[];
}

const PART_COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#22d3ee", "#fb923c", "#e879f9",
  "#4ade80", "#f472b6",
];

const GEOMETRY_BY_ACTION: Record<ActionType, ("box" | "cylinder" | "panel" | "rod" | "screw" | "connector")[]> = {
  connect: ["panel", "panel"],
  screw: ["panel", "screw"],
  align: ["panel", "panel"],
  insert: ["rod", "box"],
  attach: ["panel", "connector"],
  rotate: ["cylinder", "rod"],
  lift: ["panel", "box"],
  place: ["box", "panel"],
  tighten: ["screw", "panel"],
};

const GEOMETRY_BY_PART_NAME: Record<string, Part3D["geometry"]> = {
  panel: "panel",
  board: "panel",
  shelf: "panel",
  side: "panel",
  top: "panel",
  bottom: "panel",
  back: "panel",
  door: "panel",
  screw: "screw",
  bolt: "screw",
  nail: "screw",
  pin: "rod",
  dowel: "rod",
  rod: "rod",
  peg: "rod",
  handle: "rod",
  leg: "cylinder",
  tube: "cylinder",
  pipe: "cylinder",
  cup: "cylinder",
  glass: "cylinder",
  bowl: "cylinder",
  connector: "connector",
  bracket: "connector",
  cam: "connector",
  lock: "connector",
  hinge: "connector",
  block: "box",
  box: "box",
  drawer: "box",
  frame: "box",
  base: "box",
};

function inferGeometry(partName: string, fallback: Part3D["geometry"]): Part3D["geometry"] {
  const lower = partName.toLowerCase();
  for (const [keyword, geo] of Object.entries(GEOMETRY_BY_PART_NAME)) {
    if (lower.includes(keyword)) return geo;
  }
  return fallback;
}

function getDirectionOffset(direction: string | null | undefined): [number, number, number] {
  switch (direction) {
    case "down": return [0, 2.5, 0];
    case "up": return [0, -2.5, 0];
    case "left": return [2.5, 0, 0];
    case "right": return [-2.5, 0, 0];
    case "clockwise":
    case "counterclockwise":
      return [0, 2, 0];
    default: return [0, 2, 0];
  }
}

export function generateSceneFromSteps(steps: AssemblyStep[]): SceneData {
  const parts: Part3D[] = [];
  const arrows: Arrow3D[] = [];
  let partIdCounter = 0;

  const baseSpread = Math.max(1.5, steps.length * 0.3);

  steps.forEach((step, stepIndex) => {
    const actionType = step.actionType || "connect";
    const partNames = step.parts && step.parts.length > 0 ? step.parts : ["Part A", "Part B"];
    const fallbackGeos = GEOMETRY_BY_ACTION[actionType] || ["box", "box"];
    const dirOffset = getDirectionOffset(step.direction);

    const stepAngle = (stepIndex / steps.length) * Math.PI * 2;
    const stepRadius = baseSpread;
    const stepBaseX = Math.cos(stepAngle) * stepRadius;
    const stepBaseZ = Math.sin(stepAngle) * stepRadius;
    const stepBaseY = stepIndex * 0.4 - (steps.length * 0.2);

    partNames.forEach((partName, partIdx) => {
      const geometry = inferGeometry(partName, fallbackGeos[partIdx % fallbackGeos.length] || "box");
      const color = PART_COLORS[(partIdCounter) % PART_COLORS.length];

      const offset = partIdx === 0 ? -0.8 : 0.8;
      const assembledPos: [number, number, number] = [
        stepBaseX + offset,
        stepBaseY,
        stepBaseZ,
      ];

      const explodedOffset = partIdx === 0
        ? [-dirOffset[0], -dirOffset[1], -dirOffset[2]]
        : [dirOffset[0], dirOffset[1], dirOffset[2]];

      const explodedPos: [number, number, number] = [
        assembledPos[0] + explodedOffset[0],
        assembledPos[1] + explodedOffset[1],
        assembledPos[2] + explodedOffset[2],
      ];

      const scale = getScaleForGeometry(geometry);

      parts.push({
        id: `part-${partIdCounter++}`,
        name: partName,
        geometry,
        position: explodedPos,
        assembledPosition: assembledPos,
        rotation: [0, stepAngle * 0.3, 0],
        scale,
        color,
        stepIndex,
      });
    });

    if (partNames.length >= 2) {
      const p0Assembled: [number, number, number] = [stepBaseX - 0.8, stepBaseY, stepBaseZ];
      const p1Assembled: [number, number, number] = [stepBaseX + 0.8, stepBaseY, stepBaseZ];
      arrows.push({
        from: [p1Assembled[0] + dirOffset[0] * 0.5, p1Assembled[1] + dirOffset[1] * 0.5, p1Assembled[2] + dirOffset[2] * 0.5],
        to: p0Assembled,
        color: PART_COLORS[stepIndex % PART_COLORS.length],
        stepIndex,
      });
    }
  });

  return { parts, arrows };
}

function getScaleForGeometry(geo: Part3D["geometry"]): [number, number, number] {
  switch (geo) {
    case "panel": return [1.8, 0.1, 1.2];
    case "box": return [1, 1, 1];
    case "cylinder": return [0.3, 1.5, 0.3];
    case "rod": return [0.12, 1.8, 0.12];
    case "screw": return [0.08, 0.6, 0.08];
    case "connector": return [0.4, 0.4, 0.4];
    case "sphere": return [0.5, 0.5, 0.5];
    default: return [1, 1, 1];
  }
}

export function createArrowGeometry(from: THREE.Vector3, to: THREE.Vector3): { points: THREE.Vector3[]; direction: THREE.Vector3 } {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const points = [from, to];
  return { points, direction };
}
