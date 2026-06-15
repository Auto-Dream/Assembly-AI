import { AssemblyStep } from "./types";

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getTotalDuration(steps: AssemblyStep[]): number {
  if (!Array.isArray(steps)) return 0;
  return steps.reduce((sum, s) => sum + (typeof s?.duration === "number" ? s.duration : 0), 0);
}

export function getStepColor(index: number): string {
  const colors = [
    "#3B82F6", "#06B6D4", "#10B981", "#F59E0B",
    "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
  ];
  return colors[index % colors.length];
}
