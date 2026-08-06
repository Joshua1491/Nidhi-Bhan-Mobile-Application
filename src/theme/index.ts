// ============================================================
// Design tokens — mirrors the portal's globals.css palette.
// ============================================================

export const colors = {
  cream: "#FBF8F4",
  blush: "#F2E4DC",
  blushLight: "#F9F0EB",
  lavender: "#E8E0F0",
  lavenderLight: "#F3EFF8",
  sage: "#D9E5DB",
  sageLight: "#EDF3EE",
  peach: "#F5DDD1",
  peachLight: "#FBF0EA",
  dustyRose: "#D4A0A0",
  mauve: "#C4A0B9",
  softGold: "#C5A66B",
  warmGold: "#B8935A",
  deepPlum: "#3D2B3D",
  charcoal: "#2C2636",
  textPrimary: "#2C2636",
  textSecondary: "#6B6174",
  textMuted: "#9A90A3",
  card: "rgba(255,255,255,0.72)",
  cardBorder: "rgba(197,166,107,0.16)",
  goldTint: "rgba(197,166,107,0.10)",
} as const;

export const fonts = {
  serif: "CormorantGaramond_400Regular",
  serifLight: "CormorantGaramond_300Light",
  serifMedium: "CormorantGaramond_500Medium",
  serifSemi: "CormorantGaramond_600SemiBold",
  sans: "Outfit_300Light",
  sansRegular: "Outfit_400Regular",
  sansMedium: "Outfit_500Medium",
} as const;

export const radius = { card: 22, chip: 999, input: 14 } as const;
