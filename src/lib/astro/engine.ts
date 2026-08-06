// ============================================================
// Sample Vedic engine — deterministic, seeded by birth details.
// Produces believable, internally-consistent personalised data.
// Replace the internals with a real ephemeris later; the exported
// shapes (BirthChart, DashaState, SadeSati, DailyReading) are the
// contract the UI depends on.
// ============================================================

import {
  NAKSHATRAS,
  RASIS,
  RASI_SHORT,
  DASHA_SEQUENCE,
  TITHIS,
  YOGAS,
  RAHU_KAAL_BY_DAY,
  ABHIJIT_MUHURTA,
  LUCKY_COLORS,
  LUCKY_DIRECTIONS,
  FOCUS_LINES,
  CAUTION_LINES,
  PRACTICE_LIBRARY,
  RARE_EVENTS,
} from "./data";

// ---------- deterministic helpers ----------

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 seeded PRNG
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

function dayNumber(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

// ---------- types ----------

export interface BirthInput {
  birth_date?: string | null; // YYYY-MM-DD
  birth_time?: string | null; // HH:MM
  birth_place?: string | null;
  full_name?: string | null;
}

export interface BirthChart {
  hasData: boolean;
  moonSign: string;
  sunSign: string;
  ascendant: string;
  nakshatra: string;
  nakshatraPada: number;
  birthSummary: string;
}

export interface DashaState {
  mahaLord: string;
  mahaTheme: string;
  mahaStartYear: number;
  mahaEndYear: number;
  mahaEndLabel: string; // e.g. "March 2027"
  progressPct: number; // 0..100 through the maha dasha
  antarLord: string;
  antarEndLabel: string;
  nextLord: string;
}

export type SadeSatiPhase = "none" | "rising" | "peak" | "setting";

export interface SadeSati {
  active: boolean;
  phase: SadeSatiPhase;
  phaseLabel: string;
  monthsRemaining: number;
  turnLabel: string; // when the current phase eases, e.g. "August 2026"
  message: string;
}

export interface DailyReading {
  dateLabel: string;
  greetingName: string;
  tithi: string;
  paksha: string;
  nakshatraToday: string;
  yoga: string;
  rahuKaal: string;
  abhijit: string;
  auspiciousScore: number; // 0..100
  weatherWord: string; // e.g. "Tender", "Bold", "Reflective"
  focus: string;
  caution: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
  practice: (typeof PRACTICE_LIBRARY)[number];
  eveningPractice: (typeof PRACTICE_LIBRARY)[number];
  rareEvent: (typeof RARE_EVENTS)[number] | null;
  intentionPrompt: string;
}

// ---------- seed ----------

function userSeed(b: BirthInput): number {
  const base = `${b.birth_date ?? "x"}|${b.birth_time ?? "x"}|${b.birth_place ?? "x"}`;
  return hashString(base);
}

// ---------- birth chart ----------

export function getBirthChart(b: BirthInput): BirthChart {
  const hasData = Boolean(b.birth_date);
  const seed = userSeed(b);
  const r = rng(seed);
  const moonIdx = Math.floor(r() * 12);
  const sunIdx = Math.floor(r() * 12);
  const ascIdx = Math.floor(r() * 12);
  const nakIdx = Math.floor(r() * 27);
  const pada = 1 + Math.floor(r() * 4);

  return {
    hasData,
    moonSign: RASIS[moonIdx],
    sunSign: RASIS[sunIdx],
    ascendant: RASIS[ascIdx],
    nakshatra: NAKSHATRAS[nakIdx],
    nakshatraPada: pada,
    birthSummary: hasData
      ? `Moon in ${RASI_SHORT[moonIdx]}, ${NAKSHATRAS[nakIdx]} nakshatra, ${RASI_SHORT[ascIdx]} rising.`
      : "Add your birth details to reveal your chart.",
  };
}

// ---------- dasha ----------

export function getDasha(b: BirthInput, now = new Date()): DashaState {
  const seed = userSeed(b);
  const r = rng(seed ^ 0x9e3779b9);

  // Build a believable timeline: start the sequence at the user's birth year
  // offset, then walk forward to "now".
  const birthYear = b.birth_date ? new Date(b.birth_date).getFullYear() : 1985;
  const startOffset = Math.floor(r() * DASHA_SEQUENCE.length);

  let cursorYear = birthYear;
  let idx = startOffset;
  const nowYear = now.getFullYear() + (now.getMonth() + 1) / 12;

  // advance until the current dasha contains nowYear
  // (guard against infinite loop)
  for (let guard = 0; guard < 200; guard++) {
    const period = DASHA_SEQUENCE[idx % DASHA_SEQUENCE.length];
    const end = cursorYear + period.years;
    if (nowYear < end) break;
    cursorYear = end;
    idx++;
  }

  const maha = DASHA_SEQUENCE[idx % DASHA_SEQUENCE.length];
  const next = DASHA_SEQUENCE[(idx + 1) % DASHA_SEQUENCE.length];
  const mahaStart = cursorYear;
  const mahaEnd = cursorYear + maha.years;
  const progress = Math.min(
    100,
    Math.max(0, ((nowYear - mahaStart) / maha.years) * 100)
  );

  // Antardasha: sub-divide proportionally, pick the one we're in.
  const elapsed = nowYear - mahaStart;
  let antarCursor = 0;
  let antarLord = maha.lord;
  let antarEnd = mahaEnd;
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const sub = DASHA_SEQUENCE[(idx + i) % DASHA_SEQUENCE.length];
    const subLen = (sub.years / 120) * maha.years;
    if (elapsed < antarCursor + subLen) {
      antarLord = sub.lord;
      antarEnd = mahaStart + antarCursor + subLen;
      break;
    }
    antarCursor += subLen;
  }

  return {
    mahaLord: maha.lord,
    mahaTheme: maha.theme,
    mahaStartYear: Math.round(mahaStart),
    mahaEndYear: Math.round(mahaEnd),
    mahaEndLabel: yearToLabel(mahaEnd),
    progressPct: Math.round(progress),
    antarLord,
    antarEndLabel: yearToLabel(antarEnd),
    nextLord: next.lord,
  };
}

// ---------- REAL Vimshottari dasha (computed from the sidereal Moon) ----------
// Vimshottari is pure arithmetic once you know the Moon's sidereal longitude.
// We compute it ourselves rather than trusting VedAstro's DasaAtRange endpoint,
// which does not apply the ayanamsa to the Moon and therefore picks the wrong
// starting nakshatra lord for charts near a tropical/sidereal nakshatra flip.

// Nakshatra lords in order (Ashwini → Revati), cycling every 9.
const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];
const VIM_YEAR_DAYS = 365.25; // traditional Vimshottari year length
const NAK_ARC = 360 / 27;
const DAY_MS = 86400000;

function monthYearLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Compute the current Vimshottari Mahadasha + Antardasha from the natal
 * sidereal Moon longitude (0–360, Lahiri) and the exact birth instant.
 * Deterministic, ayanamsa-correct, and independent of any external dasha API.
 */
export function computeVimshottari(
  moonLongitude: number,
  birth: Date,
  now = new Date()
): DashaState {
  const lon = ((moonLongitude % 360) + 360) % 360;
  const nak = Math.floor(lon / NAK_ARC) % 27;
  const startLord = NAKSHATRA_LORDS[nak % 9];
  const fracTraversed = (lon % NAK_ARC) / NAK_ARC;

  const startIdx = DASHA_SEQUENCE.findIndex((d) => d.lord === startLord);
  const nowMs = now.getTime();

  // Walk the maha-dasha timeline from birth. The first period is the *balance*
  // of the starting lord; the rest are full-length.
  type Period = { idx: number; lord: string; years: number; start: number; end: number };
  const periods: Period[] = [];
  let cursor = birth.getTime();
  let idx = startIdx;
  // first (partial) period
  {
    const p = DASHA_SEQUENCE[idx];
    const balYears = p.years * (1 - fracTraversed);
    const end = cursor + balYears * VIM_YEAR_DAYS * DAY_MS;
    periods.push({ idx, lord: p.lord, years: p.years, start: cursor, end });
    cursor = end;
  }
  // subsequent full periods (enough to cover a lifetime)
  for (let k = 0; k < 11; k++) {
    idx = (idx + 1) % DASHA_SEQUENCE.length;
    const p = DASHA_SEQUENCE[idx];
    const end = cursor + p.years * VIM_YEAR_DAYS * DAY_MS;
    periods.push({ idx, lord: p.lord, years: p.years, start: cursor, end });
    cursor = end;
  }

  const maha = periods.find((p) => p.start <= nowMs && nowMs < p.end) ?? periods[0];

  // True maha start = end − full Vimshottari duration (so the first/balance
  // period reports progress against the whole maha, not just the slice).
  const mahaFullMs = maha.years * VIM_YEAR_DAYS * DAY_MS;
  const trueStart = maha.end - mahaFullMs;
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round(((nowMs - trueStart) / mahaFullMs) * 100))
  );

  // Antardasha (bhukti): subdivide the maha into 9 sub-periods in Vimshottari
  // order starting from the maha lord, each proportional to its own years.
  let antarLord = maha.lord;
  let antarEnd = maha.end;
  let subCursor = trueStart;
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const sub = DASHA_SEQUENCE[(maha.idx + i) % DASHA_SEQUENCE.length];
    const subMs = (sub.years / 120) * mahaFullMs;
    if (nowMs < subCursor + subMs) {
      antarLord = sub.lord;
      antarEnd = subCursor + subMs;
      break;
    }
    subCursor += subMs;
  }

  const mahaDef = DASHA_SEQUENCE[maha.idx];
  const next = DASHA_SEQUENCE[(maha.idx + 1) % DASHA_SEQUENCE.length];
  const mahaEndDate = new Date(maha.end);

  return {
    mahaLord: maha.lord,
    mahaTheme: mahaDef.theme,
    mahaStartYear: new Date(trueStart).getFullYear(),
    mahaEndYear: mahaEndDate.getFullYear(),
    mahaEndLabel: monthYearLabel(mahaEndDate),
    progressPct,
    antarLord,
    antarEndLabel: monthYearLabel(new Date(antarEnd)),
    nextLord: next.lord,
  };
}

export interface MahaPeriod {
  lord: string;
  theme: string;
  startYear: number;
  endYear: number;
  startLabel: string;
  endLabel: string;
  isCurrent: boolean;
  isPast: boolean;
}

/**
 * The full Mahadasha ladder from birth (balance period first, then the nine
 * full periods). Same deterministic Vimshottari math as computeVimshottari.
 */
export function vimshottariMahaTimeline(
  moonLongitude: number,
  birth: Date,
  now = new Date()
): MahaPeriod[] {
  const lon = ((moonLongitude % 360) + 360) % 360;
  const nak = Math.floor(lon / NAK_ARC) % 27;
  const startLord = NAKSHATRA_LORDS[nak % 9];
  const frac = (lon % NAK_ARC) / NAK_ARC;
  const startIdx = DASHA_SEQUENCE.findIndex((d) => d.lord === startLord);
  const nowMs = now.getTime();

  const out: MahaPeriod[] = [];
  let cursor = birth.getTime();
  let idx = startIdx;
  for (let k = 0; k <= DASHA_SEQUENCE.length; k++) {
    const p = DASHA_SEQUENCE[idx % DASHA_SEQUENCE.length];
    const years = k === 0 ? p.years * (1 - frac) : p.years;
    const end = cursor + years * VIM_YEAR_DAYS * DAY_MS;
    const s = new Date(cursor);
    const e = new Date(end);
    out.push({
      lord: p.lord,
      theme: p.theme,
      startYear: s.getFullYear(),
      endYear: e.getFullYear(),
      startLabel: monthYearLabel(s),
      endLabel: monthYearLabel(e),
      isCurrent: cursor <= nowMs && nowMs < end,
      isPast: end <= nowMs,
    });
    cursor = end;
    idx++;
  }
  return out;
}

function yearToLabel(decimalYear: number): string {
  const year = Math.floor(decimalYear);
  const monthIdx = Math.min(11, Math.max(0, Math.floor((decimalYear - year) * 12)));
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[monthIdx]} ${year}`;
}

// ---------- sade sati ----------

export function getSadeSati(b: BirthInput, now = new Date()): SadeSati {
  const seed = userSeed(b);
  const r = rng(seed ^ 0x5bf03635);
  const roll = r();

  // ~45% of users "in" some phase for a richer demo.
  if (roll > 0.45) {
    return {
      active: false,
      phase: "none",
      phaseLabel: "Clear skies",
      monthsRemaining: 0,
      turnLabel: "",
      message:
        "You are not in Sade Sati right now. Saturn is not pressing on your Moon — a window to build steadily and lay foundations that last.",
    };
  }

  const phases: { phase: SadeSatiPhase; label: string; msg: string }[] = [
    {
      phase: "rising",
      label: "First phase — the ascent",
      msg: "Saturn has entered the sign before your Moon. Early pressure is asking you to get honest about what no longer fits. This is preparation, not punishment.",
    },
    {
      phase: "peak",
      label: "Second phase — the peak",
      msg: "Saturn sits over your Moon — the most demanding stretch. Emotions feel heavier, but this is where your deepest maturity is forged. You are being built, not broken.",
    },
    {
      phase: "setting",
      label: "Third phase — the release",
      msg: "Saturn is moving past your Moon. The weight is lifting. What you endured is becoming wisdom you'll carry for decades.",
    },
  ];
  const chosen = phases[Math.floor(r() * 3) % 3];
  const monthsRemaining = 3 + Math.floor(r() * 30); // 3..32 months

  const turn = new Date(now);
  turn.setMonth(turn.getMonth() + monthsRemaining);

  return {
    active: true,
    phase: chosen.phase,
    phaseLabel: chosen.label,
    monthsRemaining,
    turnLabel: turn.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    message: chosen.msg,
  };
}

// ---------- daily reading ----------

const WEATHER_WORDS = [
  "Tender", "Bold", "Reflective", "Expansive", "Steady",
  "Luminous", "Quiet", "Magnetic", "Grounded", "Open",
];

export function getDailyReading(b: BirthInput, now = new Date()): DailyReading {
  const seed = userSeed(b);
  const day = dayNumber(now);
  const r = rng(seed ^ (day * 2654435761));

  const weekday = now.getDay();
  const tithiIdx = Math.floor(r() * 15);
  const paksha = r() > 0.5 ? "Shukla Paksha (waxing)" : "Krishna Paksha (waning)";
  const score = 38 + Math.floor(r() * 60); // 38..97

  const focus = pick(FOCUS_LINES, r());
  const caution = pick(CAUTION_LINES, r());
  const practice = pick(PRACTICE_LIBRARY.slice(0, 4), r());
  const eveningPractice = PRACTICE_LIBRARY[4]; // Evening Unwind
  const weatherWord = pick(WEATHER_WORDS, r());

  // Rare event ~ 1 in 7 days, deterministic per user+day.
  const rareRoll = r();
  const rareEvent = rareRoll > 0.86 ? pick(RARE_EVENTS, r()) : null;

  const firstName = (b.full_name ?? "").trim().split(" ")[0] || "";

  return {
    dateLabel: now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    greetingName: firstName,
    tithi: TITHIS[tithiIdx],
    paksha,
    nakshatraToday: pick(NAKSHATRAS, r()),
    yoga: pick(YOGAS, r()),
    rahuKaal: RAHU_KAAL_BY_DAY[weekday],
    abhijit: ABHIJIT_MUHURTA,
    auspiciousScore: score,
    weatherWord,
    focus,
    caution,
    luckyColor: pick(LUCKY_COLORS, r()),
    luckyNumber: 1 + Math.floor(r() * 9),
    luckyDirection: pick(LUCKY_DIRECTIONS, r()),
    practice,
    eveningPractice,
    rareEvent,
    intentionPrompt: pick(INTENTION_PROMPTS, r()),
  };
}

const INTENTION_PROMPTS = [
  "What is one thing you want today to give you?",
  "Who do you want to be in the hard moment today?",
  "What would 'enough' look like by tonight?",
  "What are you ready to stop carrying?",
  "Where can you choose ease over force today?",
  "What small promise to yourself will you keep?",
];

// Greeting based on local hour.
export function timeGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ============================================================
// MUHURTA — auspicious date finder
// ============================================================

export const MUHURTA_ACTIVITIES = [
  { id: "wedding", label: "Wedding / Engagement", note: "Venus and Jupiter favour lasting bonds." },
  { id: "business", label: "Business / Launch", note: "Strong Sun and Mercury windows for new ventures." },
  { id: "travel", label: "Travel / Journey", note: "Moon-friendly days ease movement and arrivals." },
  { id: "purchase", label: "Property / Big Purchase", note: "Earthy, stable days protect large commitments." },
  { id: "housewarming", label: "Housewarming (Griha Pravesh)", note: "Settled entry days invite calm energy home." },
  { id: "healing", label: "Surgery / Treatment", note: "Waxing-moon days support recovery." },
] as const;

export type MuhurtaTier = "best" | "good" | "neutral" | "avoid";

export interface MuhurtaDay {
  dateNum: number;
  iso: string;
  weekday: string;
  score: number;
  tier: MuhurtaTier;
  bestWindow: string;
  note: string;
}

export interface MuhurtaResult {
  activityLabel: string;
  activityNote: string;
  monthLabel: string;
  days: MuhurtaDay[];
  bestPicks: MuhurtaDay[];
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MUHURTA_WINDOWS = [
  "6:24 – 7:48 AM",
  "8:12 – 9:36 AM",
  "11:48 AM – 12:36 PM",
  "1:12 – 2:36 PM",
  "4:00 – 5:24 PM",
  "5:48 – 7:00 PM",
];

const MUHURTA_NOTES_GOOD = [
  "A clean, supportive window — intentions set now tend to hold.",
  "Benefic influences dominate; momentum is on your side.",
  "A settled, fortunate day. Move with quiet confidence.",
  "The Moon is well-placed for you — emotionally steady ground.",
  "Favourable for first steps and signatures alike.",
];

const MUHURTA_NOTES_AVOID = [
  "A heavier transit — better to wait a day or two.",
  "Friction in the sky today; avoid binding commitments.",
  "Saturn's weight makes this a day to pause, not push.",
  "The Moon is uneasy here — postpone if you can.",
];

const MUHURTA_NOTES_NEUTRAL = [
  "A workable day — fine for routine matters.",
  "Neither pushing nor pulling; proceed with normal care.",
  "Steady enough for everyday plans.",
];

export function getAuspiciousDates(
  b: BirthInput,
  activityId: string,
  year: number,
  month: number // 0-indexed
): MuhurtaResult {
  const activity =
    MUHURTA_ACTIVITIES.find((a) => a.id === activityId) ?? MUHURTA_ACTIVITIES[0];
  const baseSeed = userSeed(b) ^ hashString(activityId);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: MuhurtaDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const r = rng(baseSeed ^ (dayNumber(date) * 40503));
    const raw = r();
    const score = 30 + Math.floor(raw * 68); // 30..97
    let tier: MuhurtaTier;
    let note: string;
    if (score >= 82) {
      tier = "best";
      note = pick(MUHURTA_NOTES_GOOD, r());
    } else if (score >= 66) {
      tier = "good";
      note = pick(MUHURTA_NOTES_GOOD, r());
    } else if (score < 42) {
      tier = "avoid";
      note = pick(MUHURTA_NOTES_AVOID, r());
    } else {
      tier = "neutral";
      note = pick(MUHURTA_NOTES_NEUTRAL, r());
    }
    days.push({
      dateNum: d,
      iso: date.toISOString().slice(0, 10),
      weekday: WEEKDAYS_SHORT[date.getDay()],
      score,
      tier,
      bestWindow: pick(MUHURTA_WINDOWS, r()),
      note,
    });
  }

  const bestPicks = [...days]
    .filter((d) => d.tier === "best" || d.tier === "good")
    .sort((a, c) => c.score - a.score)
    .slice(0, 5);

  return {
    activityLabel: activity.label,
    activityNote: activity.note,
    monthLabel: new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    days,
    bestPicks,
  };
}

// ============================================================
// COMPATIBILITY — Ashtakoot Guna Milan (36 points)
// ============================================================

export interface KootaScore {
  name: string;
  max: number;
  score: number;
  note: string;
}

export interface Compatibility {
  total: number;
  max: number;
  percent: number;
  verdict: string;
  tone: "excellent" | "good" | "fair" | "challenging";
  summary: string;
  kootas: KootaScore[];
  personANak: string;
  personBNak: string;
}

function nakIndex(b: BirthInput): number {
  const r = rng(userSeed(b));
  // mirror getBirthChart's draw order so nakshatra matches the chart
  r();
  r();
  r();
  return Math.floor(r() * 27);
}

const KOOTA_DEFS: { name: string; max: number; theme: string }[] = [
  { name: "Varna", max: 1, theme: "ego balance and mutual respect" },
  { name: "Vashya", max: 2, theme: "magnetism and gentle influence" },
  { name: "Tara", max: 3, theme: "destiny and shared fortune" },
  { name: "Yoni", max: 4, theme: "physical and instinctive harmony" },
  { name: "Graha Maitri", max: 5, theme: "mental and emotional friendship" },
  { name: "Gana", max: 6, theme: "temperament and nature" },
  { name: "Bhakoot", max: 7, theme: "emotional rhythm and family flow" },
  { name: "Nadi", max: 8, theme: "health, vitality and progeny" },
];

export function getCompatibility(a: BirthInput, b: BirthInput): Compatibility {
  const seed = (userSeed(a) ^ Math.imul(userSeed(b), 2654435761)) >>> 0;
  const r = rng(seed);

  const kootas: KootaScore[] = KOOTA_DEFS.map((k) => {
    let score: number;
    // Nadi & Bhakoot behave more like pass/fail in classical matching
    if (k.name === "Nadi") {
      score = r() > 0.28 ? 8 : 0;
    } else if (k.name === "Bhakoot") {
      score = r() > 0.32 ? 7 : 0;
    } else {
      // bias toward partial-to-full
      const f = 0.45 + r() * 0.55;
      score = Math.round(Math.min(k.max, f * k.max));
    }
    const full = score === k.max;
    const zero = score === 0;
    const note = zero
      ? `A point of growth — ${k.theme} will ask for conscious care.`
      : full
      ? `Strong — ${k.theme} flows naturally between you.`
      : `Workable — ${k.theme} is largely supportive.`;
    return { name: k.name, max: k.max, score, note };
  });

  const total = kootas.reduce((s, k) => s + k.score, 0);
  const max = 36;
  const percent = Math.round((total / max) * 100);

  let tone: Compatibility["tone"];
  let verdict: string;
  let summary: string;
  if (total >= 32) {
    tone = "excellent";
    verdict = "Excellent match";
    summary =
      "A rare, deeply harmonious alignment. The foundations for trust, ease and longevity are strongly present.";
  } else if (total >= 25) {
    tone = "good";
    verdict = "Strong, promising match";
    summary =
      "A genuinely supportive pairing. Where points are lower, awareness and small remedies more than bridge the gap.";
  } else if (total >= 18) {
    tone = "fair";
    verdict = "Workable with care";
    summary =
      "A relationship with real potential that benefits from conscious effort and, traditionally, a few remedies. Worth a deeper reading.";
  } else {
    tone = "challenging";
    verdict = "Needs careful guidance";
    summary =
      "Several classical points fall short. This doesn't mean 'no' — it means a personal consultation with Dr. Nidhi is wise before big decisions.";
  }

  return {
    total,
    max,
    percent,
    verdict,
    tone,
    summary,
    kootas,
    personANak: NAKSHATRAS[nakIndex(a)],
    personBNak: NAKSHATRAS[nakIndex(b)],
  };
}

// ============================================================
// JOURNAL prompts
// ============================================================

export const JOURNAL_PROMPTS = [
  "What asked the most of you today — and how did you meet it?",
  "Name one thing you're quietly proud of from today.",
  "What feeling kept returning today? Where did you feel it in your body?",
  "What would you tell the version of you who woke up this morning?",
  "What are you ready to release before you sleep?",
  "Where did you feel most like yourself today?",
  "What small kindness — given or received — stayed with you?",
  "If today had a single word, what would it be, and why?",
  "What is one thing you want tomorrow to hold?",
  "What pattern did you notice in yourself today, without judging it?",
];

export function getJournalPrompt(now = new Date()): string {
  const idx = dayNumber(now) % JOURNAL_PROMPTS.length;
  return JOURNAL_PROMPTS[idx];
}
