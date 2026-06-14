export type ActionType = "connect" | "screw" | "align" | "insert" | "attach" | "rotate" | "lift" | "place" | "tighten";
export type Direction = "down" | "up" | "left" | "right" | "clockwise" | "counterclockwise" | null;

export interface AssemblyStep {
  number: number;
  title: string;
  instruction: string;
  duration: number;
  tools: string[];
  warning: string | null;
  actionType?: ActionType;
  parts?: string[];
  direction?: Direction;
}

export interface Session {
  id: string;
  title: string;
  language: string;
  interpretation: string;
  steps: AssemblyStep[];
  prompt_used: string;
  thumbnail_data: string;
  created_at: string;
}

export interface ProcessResult {
  title: string;
  language: string;
  interpretation: string;
  steps: AssemblyStep[];
  promptUsed: string;
  isDemo: boolean;
  imageData?: string;
  mimeType?: string;
}

export type AppView = "home" | "processing" | "results";

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];
