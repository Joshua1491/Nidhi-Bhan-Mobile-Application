// ============================================================
// Reconditioning Journeys — multi-day subliminal / affirmation
// programs led by Dr. Nidhi. Content is static; per-user progress
// lives in the journey_progress table.
// ============================================================

export interface Journey {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  totalDays: number;
  durationLabel: string;
  accent: string; // CSS color
  tint: string; // soft background tint
  premium: boolean;
  theme: string;
  promise: string;
  dailyMinutes: number;
}

export const JOURNEYS: Journey[] = [
  {
    slug: "release-the-past",
    title: "Release the Past",
    subtitle: "21 days to loosen what still holds you",
    description:
      "A guided subliminal arc to gently unhook the memories and verdicts your subconscious keeps replaying — so the past stops writing your present.",
    totalDays: 21,
    durationLabel: "21 days",
    accent: "#C4A0B9",
    tint: "rgba(196,160,185,0.10)",
    premium: false,
    theme: "Healing & closure",
    promise: "Wake lighter. Carry less.",
    dailyMinutes: 8,
  },
  {
    slug: "abundance-reset",
    title: "Abundance Reset",
    subtitle: "40 days to rewire your relationship with money",
    description:
      "Replace the scarcity scripts running beneath your decisions with a felt sense of safety, worth, and receiving. Paired with your chart's wealth indicators.",
    totalDays: 40,
    durationLabel: "40 days",
    accent: "#C5A66B",
    tint: "rgba(197,166,107,0.10)",
    premium: true,
    theme: "Wealth & worth",
    promise: "From bracing to receiving.",
    dailyMinutes: 10,
  },
  {
    slug: "magnetic-confidence",
    title: "Magnetic Confidence",
    subtitle: "14 days to stop shrinking",
    description:
      "A short, potent reconditioning to dissolve the reflex of making yourself small — and let you be seen at full size in rooms that matter.",
    totalDays: 14,
    durationLabel: "14 days",
    accent: "#B8935A",
    tint: "rgba(184,147,90,0.10)",
    premium: false,
    theme: "Self-worth & visibility",
    promise: "Take up your room.",
    dailyMinutes: 7,
  },
  {
    slug: "calm-the-mind",
    title: "Calm the Mind",
    subtitle: "21 days to a quieter nervous system",
    description:
      "Nightly sleep subliminals and breath work to settle a racing mind, ease the 3am spiral, and restore deep, repairing rest.",
    totalDays: 21,
    durationLabel: "21 days",
    accent: "#9DB4A0",
    tint: "rgba(157,180,160,0.12)",
    premium: false,
    theme: "Anxiety & sleep",
    promise: "Let the mind rest.",
    dailyMinutes: 9,
  },
  {
    slug: "attract-love",
    title: "Attract Love",
    subtitle: "30 days to open the heart",
    description:
      "Clear the protective walls your subconscious built and recondition for secure, reciprocal love — aligned with your Venus and 7th-house themes.",
    totalDays: 30,
    durationLabel: "30 days",
    accent: "#D4A0A0",
    tint: "rgba(212,160,160,0.12)",
    premium: true,
    theme: "Love & relationships",
    promise: "Safe to be chosen.",
    dailyMinutes: 9,
  },
  {
    slug: "morning-momentum",
    title: "Morning Momentum",
    subtitle: "7 days to reset your start",
    description:
      "A one-week primer: a short morning affirmation ritual that sets the subconscious tone before the world gets a vote.",
    totalDays: 7,
    durationLabel: "7 days",
    accent: "#C5A66B",
    tint: "rgba(197,166,107,0.10)",
    premium: false,
    theme: "Habit & drive",
    promise: "Own the first hour.",
    dailyMinutes: 5,
  },
];

export function getJourney(slug: string): Journey | undefined {
  return JOURNEYS.find((j) => j.slug === slug);
}
