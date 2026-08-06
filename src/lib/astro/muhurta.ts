// ============================================================
// Real muhurta (electional) engine — location-aware. Scores each
// day of a month for a chosen activity using the LOCAL panchang
// (tithi, nakshatra, yoga, weekday) computed at that place's
// sunrise, plus the day's Abhijit window. Replaces the old seeded
// placeholder. Pure + deterministic given location.
// ============================================================

import { MUHURTA_ACTIVITIES } from "./engine";
import { panchangAt, dayWindows, fmtWindow, localMidnight, type Panchang } from "./timing";

export type MuhurtaTier = "best" | "good" | "neutral" | "avoid";

export interface MuhurtaDay {
  dateNum: number;
  iso: string;
  weekday: string;
  score: number;
  tier: MuhurtaTier;
  bestWindow: string; // local clock string
  tithi: string;
  nakshatra: string;
  note: string;
}

export interface MuhurtaResult {
  activityLabel: string;
  activityNote: string;
  monthLabel: string;
  locationLabel: string;
  days: MuhurtaDay[];
  bestPicks: MuhurtaDay[];
}

// Nakshatra index groups (0-based, matching data.ts NAKSHATRAS).
const FIXED = new Set([3, 11, 20, 25]); // Rohini, U.Phalguni, U.Ashadha, U.Bhadrapada
const MOVABLE = new Set([6, 14, 21, 22, 23]); // Punarvasu, Swati, Shravana, Dhanishta, Shatabhisha
const LIGHT = new Set([0, 7, 12]); // Ashwini, Pushya, Hasta
const SOFT = new Set([4, 13, 16, 26]); // Mrigashira, Chitra, Anuradha, Revati
const SHARP = new Set([5, 8, 17, 18]); // Ardra, Ashlesha, Jyeshtha, Mula
const FIERCE = new Set([1, 9, 10, 15, 19]); // Bharani, Magha, P.Phalguni, Vishakha, P.Ashadha

// Generally auspicious yogas to avoid for new beginnings.
const BAD_YOGA = new Set([
  "Vishkambha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti",
]);

interface Rule {
  goodWeekdays: Set<number>;
  badWeekdays: Set<number>;
  favNak: Set<number>;
  avoidNak: Set<number>;
}

// Per-activity electional rules (classical, simplified for guidance).
function rulesFor(activityId: string): Rule {
  switch (activityId) {
    case "wedding":
      return { goodWeekdays: new Set([1, 3, 4, 5]), badWeekdays: new Set([2, 6, 0]),
        favNak: union(FIXED, SOFT, new Set([16, 3, 4, 26, 13])), avoidNak: union(SHARP, FIERCE) };
    case "business":
      return { goodWeekdays: new Set([1, 3, 4, 5]), badWeekdays: new Set([2, 6]),
        favNak: union(LIGHT, MOVABLE, new Set([7, 12, 0])), avoidNak: union(SHARP, FIERCE) };
    case "travel":
      return { goodWeekdays: new Set([1, 3, 4, 5]), badWeekdays: new Set([2, 0]),
        favNak: union(MOVABLE, LIGHT), avoidNak: union(FIERCE, new Set([5])) };
    case "purchase":
      return { goodWeekdays: new Set([4, 5, 3]), badWeekdays: new Set([2, 6]),
        favNak: union(FIXED, new Set([7, 3, 26])), avoidNak: union(SHARP, FIERCE) };
    case "housewarming":
      return { goodWeekdays: new Set([1, 4, 5]), badWeekdays: new Set([2, 6, 0]),
        favNak: union(FIXED, new Set([3, 26, 16, 12])), avoidNak: union(SHARP, FIERCE) };
    case "healing":
      return { goodWeekdays: new Set([1, 3, 4, 5]), badWeekdays: new Set([6]),
        favNak: union(LIGHT, new Set([7, 0, 22, 23])), avoidNak: union(FIERCE) };
    default:
      return { goodWeekdays: new Set([1, 3, 4, 5]), badWeekdays: new Set([2, 6]),
        favNak: union(FIXED, SOFT, LIGHT), avoidNak: union(SHARP, FIERCE) };
  }
}

function union(...sets: Set<number>[]): Set<number> {
  const out = new Set<number>();
  for (const s of sets) for (const v of s) out.add(v);
  return out;
}

function scoreDay(p: Panchang, rule: Rule): { score: number; note: string } {
  let score = 50;
  const reasons: string[] = [];

  if (rule.goodWeekdays.has(p.weekdayIndex)) { score += 16; }
  else if (rule.badWeekdays.has(p.weekdayIndex)) { score -= 16; reasons.push(`${p.weekday} is less supportive`); }

  if (rule.favNak.has(p.nakshatraIndex)) { score += 20; reasons.push(`${p.nakshatra} favours this`); }
  else if (rule.avoidNak.has(p.nakshatraIndex)) { score -= 16; reasons.push(`${p.nakshatra} asks for caution`); }

  // Tithi: avoid Rikta (4,9,14) and Amavasya; favour Panchami/Dashami/Ekadashi/Purnima.
  const t = p.tithiIndex % 15; // 0..14 within paksha
  if (t === 3 || t === 8 || t === 13) { score -= 14; reasons.push("Rikta tithi"); }
  if (p.tithiIndex === 29) { score -= 22; reasons.push("Amavasya"); }
  if ([4, 9, 10, 14].includes(t)) { score += 8; }

  // Paksha: waxing favours new beginnings.
  if (p.paksha.startsWith("Shukla")) score += 6;
  else score -= 4;

  if (BAD_YOGA.has(p.yoga)) { score -= 10; reasons.push(`${p.yoga} yoga`); }

  score = Math.max(5, Math.min(98, Math.round(score)));
  const note = reasons.length
    ? reasons.slice(0, 2).join("; ")
    : `${p.nakshatra} on ${p.weekday} — a steady, workable day.`;
  return { score, note };
}

function tierFor(score: number): MuhurtaTier {
  if (score >= 80) return "best";
  if (score >= 64) return "good";
  if (score < 42) return "avoid";
  return "neutral";
}

export function getAuspiciousDatesReal(
  activityId: string,
  year: number,
  month0: number,
  lat: number,
  lon: number,
  tzHours: number,
  locationLabel: string
): MuhurtaResult {
  const activity = MUHURTA_ACTIVITIES.find((a) => a.id === activityId) ?? MUHURTA_ACTIVITIES[0];
  const rule = rulesFor(activity.id);
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();

  const days: MuhurtaDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mid = localMidnight(year, month0, d, tzHours);
    const { sunrise, windows } = dayWindows(lat, lon, mid);
    const refInstant = sunrise ?? mid;
    const p = panchangAt(refInstant);
    const { score, note } = scoreDay(p, rule);
    const tier = tierFor(score);
    const abhijit = windows.find((w) => w.name === "Abhijit Muhurta");
    const bestWindow = abhijit ? fmtWindow(abhijit, tzHours) : "—";
    days.push({
      dateNum: d,
      iso: `${year}-${String(month0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      weekday: p.weekday.slice(0, 3),
      score,
      tier,
      bestWindow,
      tithi: `${p.paksha.startsWith("Shukla") ? "Shukla" : "Krishna"} ${p.tithi}`,
      nakshatra: p.nakshatra,
      note,
    });
  }

  const bestPicks = [...days]
    .filter((d) => d.tier === "best" || d.tier === "good")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    activityLabel: activity.label,
    activityNote: activity.note,
    monthLabel: new Date(year, month0, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    locationLabel,
    days,
    bestPicks,
  };
}
