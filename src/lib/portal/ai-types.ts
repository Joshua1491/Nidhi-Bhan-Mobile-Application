// Response shapes of the website's AI personalization (mirrors src/lib/ai/personalize.ts).
export interface AIDailyReading {
  weatherWord: string;
  dayQualityScore: number;
  dayQualityNote: string;
  focus: string;
  caution: string;
  intention: string;
  practiceNote: string;
}

export interface AIHorizonReading {
  dashaInsight: string;
  sadeSatiInsight: string;
  guidance: string;
}

export interface AIRemediesReading { intro: string; priority: string }
export interface AIJourneysReading { intro: string; recommendation: string }

// Compatibility result (mirrors CompatReal in the website's vedastro.ts).
export interface CompatFactor { name: string; nature: string; info: string }
export interface CompatResult {
  scorePercent: number;
  verdict: string;
  tone: "excellent" | "good" | "fair" | "challenging";
  factors: CompatFactor[];
  nakA: string;
  nakB: string;
  summary?: string;
}
