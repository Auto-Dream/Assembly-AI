import { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Text } from "@react-three/drei";
import { AssemblyStep } from "../../lib/types";
import { generateSceneFromSteps } from "./sceneBuilder";
import { PartMesh, DirectionArrow, GridFloor } from "./Parts";
import { getStepColor } from "../../lib/utils";

interface AssemblyViewer3DProps {
  steps: AssemblyStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
}

export default function AssemblyViewer3D({ steps, activeStep, onStepChange }: AssemblyViewer3DProps) {
  const [exploded, setExploded] = useState(true);

  const sceneData = useMemo(() => generateSceneFromSteps(steps), [steps]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      <div className="relative" style={{ height: "420px" }}>
        <Canvas
          camera={{ position: [6, 4, 6], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
          dpr={[1, 1.5]}
          flat
        >
          <color attach="background" args={["#0a0f1e"]} />

          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-3, 4, -3]} intensity={0.4} />
          <pointLight position={[-4, 3, -4]} intensity={0.3} color="#60a5fa" />

          <Suspense fallback={null}>
            <GridFloor />

            {sceneData.parts.map((part) => (
              <PartMesh
                key={part.id}
                part={part}
                isActive={part.stepIndex === activeStep}
                isVisible={part.stepIndex <= activeStep}
                exploded={exploded}
              />
            ))}

            {sceneData.arrows.map((arrow, i) => (
              <DirectionArrow
                key={`arrow-${i}`}
                from={arrow.from}
                to={arrow.to}
                color={arrow.color}
                isActive={arrow.stepIndex === activeStep}
              />
            ))}

            <Float speed={2} floatIntensity={0.3} rotationIntensity={0}>
              <Text
                position={[0, 3.5, 0]}
                fontSize={0.3}
                color={getStepColor(activeStep)}
                anchorX="center"
                anchorY="middle"
              >
                {`Step ${activeStep + 1}: ${steps[activeStep]?.title || ""}`}
              </Text>
            </Float>
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
            makeDefault
          />
        </Canvas>

        {/* Overlay controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            onClick={() => setExploded(!exploded)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all backdrop-blur-sm ${
              exploded
                ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                : "bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {exploded ? "Exploded" : "Assembled"}
          </button>
        </div>

        {/* Step indicator overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10">
          <button
            onClick={() => onStepChange(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-1 overflow-hidden">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 min-w-[8px] ${
                  i === activeStep
                    ? "bg-blue-500"
                    : i < activeStep
                    ? "bg-blue-500/30"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onStepChange(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Drag hint */}
        <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-md bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-[10px] text-slate-500 pointer-events-none z-10">
          Drag to rotate / Scroll to zoom
        </div>
      </div>
    </div>
  );
}
