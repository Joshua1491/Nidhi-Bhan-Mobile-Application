// ============================================================
// Natal condition of the dasha lords — Layer 1 of individual
// accuracy. "Jupiter Mahadasha" is shared by 1/9th of humanity;
// Jupiter AS PLACED IN THIS CHART (houses it rules from this
// ascendant, house/sign/nakshatra it occupies, dignity, motion,
// aspects it receives) is unique. This module derives that
// condition from the canonical FullChart with classical, testable
// rules — no interpretation, no prose, just facts the AI layer is
// then constrained to write from.
//
// Pure module: no network, no Date.now(), fully golden-testable.
// Classical sources: Parashari sign rulership, exaltation /
// debilitation, sign-level moolatrikona, naisargika (natural)
// graha maitri, and graha drishti (special aspects for Mars /
// Jupiter / Saturn). Nodes (Rahu/Ketu) own no signs and are read
// through their dispositor; we do not cast nodal aspects (the
// traditions disagree — we stay conservative).
// ============================================================

import type { FullChart, PlanetPosition } from "./fullchart";

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

export const SIGN_LORDS: Record<string, string> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

// Exaltation signs (sign-level, classical). Debilitation is always
// the 7th sign from exaltation — derived, never duplicated.
const EXALTATION: Record<string, Sign> = {
  Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo",
  Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra",
};

// Sign-level moolatrikona (degree ranges ignored at this layer).
const MOOLATRIKONA: Record<string, Sign> = {
  Sun: "Leo", Moon: "Taurus", Mars: "Aries", Mercury: "Virgo",
  Jupiter: "Sagittarius", Venus: "Libra", Saturn: "Aquarius",
};

// Naisargika (natural) friendship — Parashara. maitri[a][b] is how
// graha a regards graha b (not symmetric: Moon befriends Mercury,
// Mercury calls Moon an enemy).
const FRIENDS: Record<string, string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const ENEMIES: Record<string, string[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

export type Maitri = "friend" | "enemy" | "neutral";

export function naisargikaMaitri(of: string, towards: string): Maitri {
  if (FRIENDS[of]?.includes(towards)) return "friend";
  if (ENEMIES[of]?.includes(towards)) return "enemy";
  return "neutral";
}

export type SignDignity =
  | "Exalted" | "Debilitated" | "Moolatrikona" | "Own sign"
  | "Friend's sign" | "Enemy's sign" | "Neutral sign";

const signIndex = (s: string) => SIGNS.indexOf(s as Sign);
const oppositeSign = (s: Sign): Sign => SIGNS[(signIndex(s) + 6) % 12];

/** Sign-level dignity from first principles. Null for nodes. */
export function signDignity(graha: string, sign: string): SignDignity | null {
  if (graha === "Rahu" || graha === "Ketu") return null; // read via dispositor
  if (signIndex(sign) === -1) return null;
  if (EXALTATION[graha] === sign) return "Exalted";
  if (EXALTATION[graha] && oppositeSign(EXALTATION[graha]) === sign) return "Debilitated";
  if (MOOLATRIKONA[graha] === sign) return "Moolatrikona";
  if (SIGN_LORDS[sign] === graha) return "Own sign";
  const rel = naisargikaMaitri(graha, SIGN_LORDS[sign]);
  if (rel === "friend") return "Friend's sign";
  if (rel === "enemy") return "Enemy's sign";
  return "Neutral sign";
}

// What each house GOVERNS — the vocabulary the AI must use so that
// guidance lands in a life domain, not a mood.
export const HOUSE_DOMAINS: Record<number, string> = {
  1: "self, body, identity and personal direction",
  2: "money, savings, speech and family of origin",
  3: "courage, effort, siblings and communication",
  4: "home, mother, property and inner peace",
  5: "creativity, children, romance and learning",
  6: "health, daily work, service and obstacles",
  7: "marriage, partnership and one-to-one dealings",
  8: "transformation, shared finances and the hidden",
  9: "fortune, dharma, father, teachers and long journeys",
  10: "career, status, authority and public life",
  11: "gains, income, friends and aspirations",
  12: "expenses, sleep, foreign lands, isolation and release",
};

/** House (1–12, whole-sign) that a sign occupies from the ascendant. */
export function houseOfSign(sign: string, ascSign: string): number {
  const si = signIndex(sign), ai = signIndex(ascSign);
  if (si === -1 || ai === -1) return 0;
  return ((si - ai + 12) % 12) + 1;
}

/** Houses a graha owns from this ascendant (whole-sign). Nodes: none. */
export function ownedHouses(graha: string, ascSign: string): { house: number; sign: Sign; domain: string }[] {
  return SIGNS.filter((s) => SIGN_LORDS[s] === graha).map((s) => {
    const house = houseOfSign(s, ascSign);
    return { house, sign: s, domain: HOUSE_DOMAINS[house] ?? "" };
  }).sort((a, b) => a.house - b.house);
}

// Graha drishti (whole-sign): every graha aspects the 7th from
// itself; Mars adds 4th & 8th, Jupiter 5th & 9th, Saturn 3rd & 10th.
const SPECIAL_DRISHTI: Record<string, number[]> = {
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
};

/** Houses aspected by a graha sitting in `fromHouse`. Nodes cast none here. */
export function aspectedHouses(graha: string, fromHouse: number): number[] {
  if (graha === "Rahu" || graha === "Ketu") return [];
  if (fromHouse < 1 || fromHouse > 12) return [];
  const offsets = SPECIAL_DRISHTI[graha] ?? [7];
  return offsets.map((o) => ((fromHouse - 1 + o - 1) % 12) + 1).sort((a, b) => a - b);
}

/** Grahas (other than the occupant) aspecting a given house. */
export function aspectsOnHouse(planets: PlanetPosition[], house: number): string[] {
  return planets
    .filter((p) => p.graha !== "Rahu" && p.graha !== "Ketu")
    .filter((p) => aspectedHouses(p.graha, p.house).includes(house))
    .map((p) => p.graha);
}

const NATURAL_BENEFICS = new Set(["Jupiter", "Venus", "Moon", "Mercury"]);

export interface LordProfile {
  lord: string;
  isNode: boolean;
  naturalNature: "benefic" | "malefic";
  sign: string;
  signDegrees: number;
  house: number;
  houseDomain: string;
  nakshatra: string;
  nakshatraPada: number;
  nakshatraLord: string;
  dignity: SignDignity | null;       // derived here, sign-level classical
  cachedDignity: string;             // what the upstream source claimed
  dignityMismatch: boolean;          // tripwire for the validate layer
  retrograde: boolean;
  combust: boolean;
  ownedHouses: { house: number; sign: Sign; domain: string }[];
  aspectedBy: string[];              // grahas aspecting its house
  conjunctWith: string[];            // grahas sharing its house
  dispositor: { graha: string; sign: string; house: number } | null; // for nodes esp.
  navamshaSign: string | null;       // D9 — strength behind the throne
}

export function lordProfile(chart: FullChart, lord: string): LordProfile | null {
  const p = chart.planets.find((x) => x.graha === lord);
  if (!p || !p.sign || p.house < 1) return null;
  const isNode = lord === "Rahu" || lord === "Ketu";
  const dignity = signDignity(lord, p.sign);
  const dispGraha = SIGN_LORDS[p.sign] ?? null;
  const disp = dispGraha ? chart.planets.find((x) => x.graha === dispGraha) : null;
  return {
    lord,
    isNode,
    naturalNature: NATURAL_BENEFICS.has(lord) ? "benefic" : "malefic",
    sign: p.sign,
    signDegrees: p.signDegrees,
    house: p.house,
    houseDomain: HOUSE_DOMAINS[p.house] ?? "",
    nakshatra: p.nakshatra,
    nakshatraPada: p.nakshatraPada,
    nakshatraLord: p.nakshatraLord,
    dignity,
    cachedDignity: p.dignity,
    dignityMismatch: dignity !== null && !dignityAgrees(dignity, p.dignity),
    retrograde: p.retrograde,
    combust: p.combust,
    ownedHouses: ownedHouses(lord, chart.ascSign),
    aspectedBy: aspectsOnHouse(chart.planets, p.house).filter((g) => g !== lord),
    conjunctWith: chart.planets.filter((x) => x.graha !== lord && x.house === p.house).map((x) => x.graha),
    dispositor: disp ? { graha: disp.graha, sign: disp.sign, house: disp.house } : null,
    navamshaSign: p.vargas?.D9 ?? null,
  };
}

// The cached dignity (VedAstro booleans, degree-aware) and our
// sign-level reading legitimately differ in wording; they must not
// differ in DIRECTION (e.g. cached "Neutral" for a debilitated sign).
function dignityAgrees(derived: SignDignity, cached: string): boolean {
  if (derived === "Exalted") return cached === "Exalted";
  if (derived === "Debilitated") return cached === "Debilitated";
  return cached !== "Exalted" && cached !== "Debilitated";
}

export interface DashaNatalFactors {
  ascSign: string;
  maha: LordProfile | null;
  antar: LordProfile | null;
  mahaAntarRelation: Maitri | null;  // how MD lord regards AD lord
  moonHouse: number;                 // natal Moon's house (chandra lagna anchor)
}

export function dashaNatalFactors(chart: FullChart, mahaLord: string, antarLord: string): DashaNatalFactors {
  const maha = lordProfile(chart, mahaLord);
  const antar = lordProfile(chart, antarLord);
  const moon = chart.planets.find((p) => p.graha === "Moon");
  const nodeless = (g: string) => g !== "Rahu" && g !== "Ketu";
  return {
    ascSign: chart.ascSign,
    maha,
    antar,
    mahaAntarRelation:
      nodeless(mahaLord) && nodeless(antarLord) ? naisargikaMaitri(mahaLord, antarLord) : null,
    moonHouse: moon?.house ?? 0,
  };
}

// ---------- deterministic prompt block ----------
// The AI is a WRITER, not an astrologer: it may only restate what is
// in this block. Rendering it here (not in the prompt template) keeps
// it testable and identical everywhere it is used.

function profileLines(label: string, p: LordProfile | null): string[] {
  if (!p) return [`${label}: (unavailable — say nothing specific about it)`];
  const out: string[] = [];
  const flags = [
    p.retrograde ? "retrograde" : "",
    p.combust ? "combust (weakened by the Sun)" : "",
  ].filter(Boolean).join(", ");
  out.push(
    `${label}: ${p.lord}${p.isNode ? " (shadow graha)" : ""} in ${p.sign}, house ${p.house} (${p.houseDomain}), ` +
    `${p.nakshatra} pada ${p.nakshatraPada} (ruled by ${p.nakshatraLord})${flags ? `, ${flags}` : ""}.`
  );
  if (p.dignity) out.push(`  Dignity: ${p.dignity}.`);
  if (p.ownedHouses.length > 0) {
    out.push(
      `  As ${chartLordLabel(p)} it governs: ` +
      p.ownedHouses.map((h) => `house ${h.house} (${h.domain})`).join("; ") + "."
    );
  }
  if (p.isNode && p.dispositor) {
    out.push(
      `  Expresses through its dispositor ${p.dispositor.graha} in ${p.dispositor.sign}, house ${p.dispositor.house}.`
    );
  }
  if (p.conjunctWith.length > 0) out.push(`  Conjunct: ${p.conjunctWith.join(", ")}.`);
  if (p.aspectedBy.length > 0) out.push(`  Receives aspects from: ${p.aspectedBy.join(", ")}.`);
  if (p.navamshaSign) out.push(`  Navamsha (D9): ${p.navamshaSign}.`);
  return out;
}

function chartLordLabel(p: LordProfile): string {
  const hs = p.ownedHouses.map((h) => ordinal(h.house)).join(" and ");
  return `lord of the ${hs} house${p.ownedHouses.length > 1 ? "s" : ""}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Render the factor block fed verbatim to the AI layer. */
export function renderNatalFactorBlock(f: DashaNatalFactors): string {
  const lines: string[] = [];
  lines.push(`Ascendant: ${f.ascSign}. Natal Moon in house ${f.moonHouse}.`);
  lines.push(...profileLines("Mahadasha lord (the era)", f.maha));
  if (f.antar && f.maha && f.antar.lord === f.maha.lord) {
    lines.push(
      `Antardasha lord (the chapter): the same ${f.maha.lord} — its own sub-period, the era's themes at full intensity.`
    );
  } else {
    lines.push(...profileLines("Antardasha lord (the chapter)", f.antar));
  }
  if (f.mahaAntarRelation) {
    lines.push(
      `Relationship: the Mahadasha lord regards the Antardasha lord as a ${f.mahaAntarRelation === "neutral" ? "neutral" : f.mahaAntarRelation}.`
    );
  }
  return lines.join("\n");
}
