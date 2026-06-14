import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Part3D } from "./sceneBuilder";

interface PartMeshProps {
  part: Part3D;
  isActive: boolean;
  isVisible: boolean;
  exploded: boolean;
}

export function PartMesh({ part, isActive, isVisible, exploded }: PartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const targetPos = useMemo(() => {
    const pos = exploded ? part.position : part.assembledPosition;
    return new THREE.Vector3(...pos);
  }, [exploded, part.position, part.assembledPosition]);

  const targetScale = useMemo(() => {
    if (!isVisible) return new THREE.Vector3(0.001, 0.001, 0.001);
    return new THREE.Vector3(...part.scale);
  }, [isVisible, part.scale]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(targetPos, 0.08);
    meshRef.current.scale.lerp(targetScale, 0.1);
  });

  const geometry = useMemo(() => {
    switch (part.geometry) {
      case "panel":
        return new THREE.BoxGeometry(1, 1, 1);
      case "box":
        return new THREE.BoxGeometry(1, 1, 1);
      case "cylinder":
        return new THREE.CylinderGeometry(1, 1, 1, 16);
      case "rod":
        return new THREE.CylinderGeometry(1, 1, 1, 8);
      case "screw":
        return new THREE.CylinderGeometry(0.6, 1, 1, 6);
      case "connector":
        return new THREE.DodecahedronGeometry(1, 0);
      case "sphere":
        return new THREE.SphereGeometry(1, 16, 16);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [part.geometry]);

  if (!isVisible) return null;

  return (
    <mesh
      ref={meshRef}
      rotation={part.rotation}
      position={exploded ? part.position : part.assembledPosition}
      scale={part.scale}
      geometry={geometry}
    >
      <meshStandardMaterial
        color={part.color}
        transparent
        opacity={isActive ? 0.95 : 0.55}
        emissive={isActive ? part.color : "#000000"}
        emissiveIntensity={isActive ? 0.4 : 0}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

interface DirectionArrowProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  isActive: boolean;
}

export function DirectionArrow({ from, to, color, isActive }: DirectionArrowProps) {
  const { midpoint, rotation, length } = useMemo(() => {
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    const len = dir.length();
    if (len < 0.01) return { midpoint: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], length: 0 };
    dir.normalize();

    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2,
    ];

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    return { midpoint: mid, rotation: [euler.x, euler.y, euler.z] as [number, number, number], length: len };
  }, [from, to]);

  if (length < 0.01) return null;

  const opacity = isActive ? 0.7 : 0.15;

  return (
    <group position={midpoint} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, length * 0.7, 6]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, length * 0.35, 0]}>
        <coneGeometry args={[0.1, 0.25, 6]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

export function GridFloor() {
  return (
    <group>
      <gridHelper args={[12, 12, "#334155", "#1e293b"]} position={[0, -3, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.01, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
