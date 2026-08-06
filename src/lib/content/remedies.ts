// ============================================================
// Remedies catalog (upayas). Static content; per-user tracking
// lives in the remedy_progress table. Recommendations are seeded
// from the user's current dasha + Sade Sati.
// ============================================================

import { getDasha, getSadeSati, type BirthInput } from "../astro/engine";

export type RemedyCategory =
  | "Mantra"
  | "Ritual"
  | "Fasting"
  | "Daan"
  | "Gemstone"
  | "Practice";

export interface Remedy {
  slug: string;
  title: string;
  category: RemedyCategory;
  planet: string; // graha it pacifies, or "All"
  cadence: string; // "Daily", "Weekly · Saturday", etc.
  accent: string;
  short: string;
  instruction: string;
  premium: boolean; // gemstones require a consult
}

export const REMEDIES: Remedy[] = [
  // ---- Sun ----
  {
    slug: "gayatri-mantra",
    title: "Gayatri Mantra",
    category: "Mantra",
    planet: "Sun",
    cadence: "Daily · sunrise",
    accent: "#C5A66B",
    short: "Strengthens vitality, confidence and clarity of purpose.",
    instruction: "Chant 11 times at sunrise, facing east, with a calm breath between rounds.",
    premium: false,
  },
  {
    slug: "surya-arghya",
    title: "Surya Arghya (water offering)",
    category: "Ritual",
    planet: "Sun",
    cadence: "Daily · morning",
    accent: "#C5A66B",
    short: "Honours the Sun to steady self-worth and recognition.",
    instruction: "At sunrise, offer water from a copper vessel toward the sun while standing barefoot.",
    premium: false,
  },
  // ---- Moon ----
  {
    slug: "chandra-mantra",
    title: "Chandra Mantra",
    category: "Mantra",
    planet: "Moon",
    cadence: "Daily · evening",
    accent: "#B9A7C9",
    short: "Soothes the emotional body; eases restlessness and worry.",
    instruction: "Chant 'Om Som Somaya Namah' 16 times in the evening, ideally near water or moonlight.",
    premium: false,
  },
  {
    slug: "white-daan",
    title: "Offer white (rice, milk, flowers)",
    category: "Daan",
    planet: "Moon",
    cadence: "Weekly · Monday",
    accent: "#B9A7C9",
    short: "A Monday giving to settle the mind and invite calm.",
    instruction: "On Mondays, donate rice, milk or white flowers to someone in need.",
    premium: false,
  },
  // ---- Mars ----
  {
    slug: "hanuman-chalisa",
    title: "Hanuman Chalisa",
    category: "Mantra",
    planet: "Mars",
    cadence: "Daily",
    accent: "#C98B7A",
    short: "Builds courage and protection; also classically eases Saturn.",
    instruction: "Recite once daily, unhurried. Tuesdays and Saturdays are especially potent.",
    premium: false,
  },
  {
    slug: "mangal-fast",
    title: "Tuesday fast",
    category: "Fasting",
    planet: "Mars",
    cadence: "Weekly · Tuesday",
    accent: "#C98B7A",
    short: "Channels restless fire into discipline and resolve.",
    instruction: "Keep a simple sattvic fast on Tuesdays; break it gently after sunset.",
    premium: false,
  },
  // ---- Mercury ----
  {
    slug: "budha-mantra",
    title: "Budha Mantra",
    category: "Mantra",
    planet: "Mercury",
    cadence: "Daily",
    accent: "#9DB4A0",
    short: "Sharpens communication, learning and clear thinking.",
    instruction: "Chant 'Om Bum Budhaya Namah' 9 times, ideally on Wednesday mornings.",
    premium: false,
  },
  {
    slug: "green-daan",
    title: "Offer green (lentils, plants)",
    category: "Daan",
    planet: "Mercury",
    cadence: "Weekly · Wednesday",
    accent: "#9DB4A0",
    short: "Supports steadiness of mind and honest speech.",
    instruction: "On Wednesdays, donate green moong or gift a living plant.",
    premium: false,
  },
  // ---- Jupiter ----
  {
    slug: "vishnu-sahasranama",
    title: "Vishnu Sahasranama",
    category: "Mantra",
    planet: "Jupiter",
    cadence: "Weekly · Thursday",
    accent: "#C5A66B",
    short: "Invites wisdom, expansion and good fortune.",
    instruction: "Recite on Thursdays, or listen mindfully if reciting feels long.",
    premium: false,
  },
  {
    slug: "yellow-daan",
    title: "Offer yellow (turmeric, chana dal)",
    category: "Daan",
    planet: "Jupiter",
    cadence: "Weekly · Thursday",
    accent: "#C5A66B",
    short: "A Thursday giving to open paths of growth and grace.",
    instruction: "On Thursdays, donate turmeric, gram dal or yellow cloth.",
    premium: false,
  },
  // ---- Venus ----
  {
    slug: "shukra-mantra",
    title: "Shukra Mantra",
    category: "Mantra",
    planet: "Venus",
    cadence: "Daily",
    accent: "#D4A0A0",
    short: "Softens the heart; supports love, beauty and comfort.",
    instruction: "Chant 'Om Shum Shukraya Namah' 16 times, Friday mornings ideal.",
    premium: false,
  },
  // ---- Saturn ----
  {
    slug: "shani-mantra",
    title: "Shani Mantra",
    category: "Mantra",
    planet: "Saturn",
    cadence: "Daily · Saturday focus",
    accent: "#7E8AA0",
    short: "Steadies you through Saturn's lessons with patience.",
    instruction: "Chant 'Om Sham Shanaischaraya Namah' 23 times, especially on Saturdays.",
    premium: false,
  },
  {
    slug: "sesame-oil-daan",
    title: "Offer sesame oil & black items",
    category: "Daan",
    planet: "Saturn",
    cadence: "Weekly · Saturday",
    accent: "#7E8AA0",
    short: "A classical Saturn remedy to lighten heavy seasons.",
    instruction: "On Saturdays, donate sesame oil, black sesame or warm clothing to those in need.",
    premium: false,
  },
  {
    slug: "shani-fast",
    title: "Saturday fast",
    category: "Fasting",
    planet: "Saturn",
    cadence: "Weekly · Saturday",
    accent: "#7E8AA0",
    short: "Builds the endurance Saturn rewards.",
    instruction: "Keep a simple fast on Saturdays; many break it after seeing the evening star.",
    premium: false,
  },
  // ---- Rahu / Ketu ----
  {
    slug: "rahu-ketu-mantra",
    title: "Rahu–Ketu Shanti Mantra",
    category: "Mantra",
    planet: "Rahu",
    cadence: "Daily",
    accent: "#9A8AA6",
    short: "Calms the nodes; eases confusion and sudden change.",
    instruction: "Chant the Durga or Ganesha mantra 11 times to steady nodal turbulence.",
    premium: false,
  },
  // ---- Universal practice ----
  {
    slug: "gratitude-practice",
    title: "Evening gratitude",
    category: "Practice",
    planet: "All",
    cadence: "Daily · night",
    accent: "#C4A0B9",
    short: "The simplest remedy — reconditioning the mind toward sufficiency.",
    instruction: "Before sleep, name three things you're grateful for and feel each one for a breath.",
    premium: false,
  },
  // ---- Gemstones (consult required) ----
  {
    slug: "yellow-sapphire",
    title: "Yellow Sapphire (Pukhraj)",
    category: "Gemstone",
    planet: "Jupiter",
    cadence: "Wear after consult",
    accent: "#C5A66B",
    short: "Jupiter's stone for wisdom and fortune — only after a reading.",
    instruction: "Never wear a gemstone without a personal chart consultation. Book with Dr. Nidhi first.",
    premium: true,
  },
  {
    slug: "blue-sapphire",
    title: "Blue Sapphire (Neelam)",
    category: "Gemstone",
    planet: "Saturn",
    cadence: "Wear after consult",
    accent: "#7E8AA0",
    short: "Saturn's powerful stone — potent, and not for everyone.",
    instruction: "Blue sapphire must be tested and prescribed individually. Always consult Dr. Nidhi first.",
    premium: true,
  },
  {
    slug: "pearl",
    title: "Pearl (Moti)",
    category: "Gemstone",
    planet: "Moon",
    cadence: "Wear after consult",
    accent: "#B9A7C9",
    short: "The Moon's stone for emotional calm and clarity.",
    instruction: "Suitability depends on your chart. Confirm with Dr. Nidhi before wearing.",
    premium: true,
  },
];

export function getRemedy(slug: string): Remedy | undefined {
  return REMEDIES.find((r) => r.slug === slug);
}

/**
 * Seeded recommendations from the user's current dasha lord and,
 * if active, Sade Sati (Saturn). Returns 3–4 remedies, no gemstones
 * (those need a consult).
 */
/** Recommendations from an already-computed (real) dasha lord + Sade Sati status. */
export function getRecommendedRemediesByPeriod(mahaLord: string, sadeSatiActive: boolean): Remedy[] {
  const targetPlanets = new Set<string>([mahaLord]);
  if (sadeSatiActive) targetPlanets.add("Saturn");

  const picks: Remedy[] = [];
  for (const r of REMEDIES) {
    if (r.premium) continue;
    if (targetPlanets.has(r.planet)) picks.push(r);
    if (picks.length >= 3) break;
  }
  const gratitude = getRemedy("gratitude-practice");
  if (gratitude && !picks.find((p) => p.slug === gratitude.slug)) picks.push(gratitude);
  return picks.slice(0, 4);
}

export function getRecommendedRemedies(b: BirthInput, now = new Date()): Remedy[] {
  const dasha = getDasha(b, now);
  const sade = getSadeSati(b, now);

  const targetPlanets = new Set<string>([dasha.mahaLord]);
  if (sade.active) targetPlanets.add("Saturn");

  const picks: Remedy[] = [];
  for (const r of REMEDIES) {
    if (r.premium) continue;
    if (targetPlanets.has(r.planet)) picks.push(r);
    if (picks.length >= 3) break;
  }

  // Always anchor with the universal grounding practice.
  const gratitude = getRemedy("gratitude-practice");
  if (gratitude && !picks.find((p) => p.slug === gratitude.slug)) {
    picks.push(gratitude);
  }

  return picks.slice(0, 4);
}
