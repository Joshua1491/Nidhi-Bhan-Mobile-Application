// ============================================================
// Transit-to-natal contacts — Layer 2 of individual accuracy.
// Layer 1 (natal.ts) gives the dasha lords as placed in THIS
// chart; this module gives TODAY'S sky measured against the same
// chart: where each graha is transiting from the natal lagna and
// natal Moon, which natal points it touches, whether the current
// dasha lords are being activated by transit (the classical
// dasha + gochara double-trigger), plus tarabala and chandrabala —
// the classical person-to-day operators.
//
// Split deliberately in two:
//   1. transitPositions(date)  — ephemeris (astronomy-engine),
//      same Lahiri pipeline as timing.ts (cross-checked to
//      VedAstro ~0.005°). Mean lunar node for Rahu; Ketu opposite.
//   2. everything else — PURE functions of (positions, chart),
//      fully golden-testable with synthetic skies.
// ============================================================

import * as Astronomy from "astronomy-engine";
import { lahiriAyanamsa } from "./timing";
import { NAKSHATRAS } from "./data";
import type { FullChart } from "./fullchart";
import { NAKSHATRA_LORDS } from "./fullchart";
import { SIGNS, houseOfSign, HOUSE_DOMAINS } from "./natal";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const NAK_ARC = 360 / 27;

export interface TransitPosition {
  graha: string;
  longitude: number; // sidereal (Lahiri), 0–360
  sign: string;
  signDegrees: number;
  nakshatra: string;
  nakshatraIndex: number;
  nakshatraLord: string;
  retrograde: boolean;
}

const BODY: Record<string, Astronomy.Body> = {
  Mars: Astronomy.Body.Mars,
  Mercury: Astronomy.Body.Mercury,
  Jupiter: Astronomy.Body.Jupiter,
  Venus: Astronomy.Body.Venus,
  Saturn: Astronomy.Body.Saturn,
};

/** Tropical geocentric ecliptic longitude (of date) for a planet. */
function planetTropicalLon(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(vec).elon;
}

/** Mean lunar ascending node, tropical (standard jyotish Rahu). */
export function meanNodeTropical(date: Date): number {
  const JD = 2440587.5 + date.getTime() / 86400000;
  const T = (JD - 2451545.0) / 36525.0;
  // Meeus, Astronomical Algorithms (2nd ed.), ch. 47.
  const omega =
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T +
    (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0;
  return norm360(omega);
}

function describe(graha: string, sidereal: number, retrograde: boolean): TransitPosition {
  const nakIndex = Math.floor(sidereal / NAK_ARC) % 27;
  return {
    graha,
    longitude: sidereal,
    sign: SIGNS[Math.floor(sidereal / 30) % 12],
    signDegrees: sidereal % 30,
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatraIndex: nakIndex,
    nakshatraLord: NAKSHATRA_LORDS[nakIndex % 9],
    retrograde,
  };
}

/** Sidereal positions of all 9 grahas at an instant. */
export function transitPositions(date: Date): TransitPosition[] {
  const ay = lahiriAyanamsa(date);
  const later = new Date(date.getTime() + 3600_000); // +1h for motion sign
  const out: TransitPosition[] = [];

  out.push(describe("Sun", norm360(Astronomy.SunPosition(date).elon - ay), false));
  out.push(describe("Moon", norm360(Astronomy.EclipticGeoMoon(date).lon - ay), false));

  for (const graha of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
    const lon = planetTropicalLon(BODY[graha], date);
    const lonLater = planetTropicalLon(BODY[graha], later);
    const moving = norm360(lonLater - lon); // <180 → direct
    out.push(describe(graha, norm360(lon - ay), moving > 180));
  }

  const rahu = norm360(meanNodeTropical(date) - ay);
  out.push(describe("Rahu", rahu, true));  // mean node moves retrograde
  out.push(describe("Ketu", norm360(rahu + 180), true));
  return out;
}

// ---------- pure analysis ----------

/** Circular separation in degrees, 0–180. */
export function orb(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}

export interface Contact {
  transiting: string;
  natalPoint: string;        // graha name or "Ascendant"
  kind: "conjunction" | "opposition";
  orbDegrees: number;        // to the exact point
  exact: boolean;            // within EXACT_ORB
}

export const EXACT_ORB = 3;

/** Whole-sign conjunctions/oppositions of transits to natal points, with orb. */
export function contactsToNatal(transits: TransitPosition[], chart: FullChart): Contact[] {
  const points: { name: string; lon: number; sign: string }[] = chart.planets
    .filter((p) => p.sign && isFinite(p.longitude))
    .map((p) => ({ name: p.graha, lon: p.longitude, sign: p.sign }));
  const ascLon = SIGNS.indexOf(chart.ascSign as (typeof SIGNS)[number]) * 30 + chart.ascendant.degrees;
  points.push({ name: "Ascendant", lon: ascLon, sign: chart.ascSign });

  const out: Contact[] = [];
  for (const t of transits) {
    for (const n of points) {
      // NB: a graha contacting its own natal point is a return (or its
      // opposition) — classically significant, so it is NOT skipped.
      const sameSign = t.sign === n.sign;
      const oppSign = t.sign === SIGNS[(SIGNS.indexOf(n.sign as (typeof SIGNS)[number]) + 6) % 12];
      if (!sameSign && !oppSign) continue;
      const o = sameSign ? orb(t.longitude, n.lon) : 180 - orb(t.longitude, n.lon);
      out.push({
        transiting: t.graha,
        natalPoint: n.name,
        kind: sameSign ? "conjunction" : "opposition",
        orbDegrees: Math.round(o * 100) / 100,
        exact: o <= EXACT_ORB,
      });
    }
  }
  return out.sort((a, b) => a.orbDegrees - b.orbDegrees);
}

// ---- tarabala (today's nakshatra counted from natal Moon's) ----

export const TARAS = [
  "Janma", "Sampat", "Vipat", "Kshema", "Pratyak",
  "Sadhaka", "Vadha", "Mitra", "Parama Mitra",
] as const;

export interface Tarabala {
  count: number;            // 1..27 from natal nakshatra
  tara: (typeof TARAS)[number];
  favorable: boolean;       // Vipat / Pratyak / Vadha are adverse; Janma is sensitive
  note: string;
}

export function tarabala(todayNakIndex: number, natalMoonNakIndex: number): Tarabala {
  const count = ((todayNakIndex - natalMoonNakIndex + 27) % 27) + 1;
  const tara = TARAS[(count - 1) % 9];
  const adverse = tara === "Vipat" || tara === "Pratyak" || tara === "Vadha";
  const sensitive = tara === "Janma";
  return {
    count,
    tara,
    favorable: !adverse && !sensitive,
    note: adverse
      ? "an adverse tara — favour routine over new beginnings"
      : sensitive
        ? "your birth tara — emotionally heightened, keep the day gentle"
        : "a supportive tara",
  };
}

// ---- chandrabala (transit Moon's house from natal Moon) ----

export interface Chandrabala {
  houseFromMoon: number; // 1..12
  quality: "strong" | "neutral" | "challenging";
}

export function chandrabala(transitMoonSign: string, natalMoonSign: string): Chandrabala {
  const h = houseOfSign(transitMoonSign, natalMoonSign);
  const strong = [1, 3, 6, 7, 10, 11].includes(h);
  const challenging = [4, 8, 12].includes(h);
  return { houseFromMoon: h, quality: strong ? "strong" : challenging ? "challenging" : "neutral" };
}

// ---------- assembled factors + deterministic prompt block ----------

export interface TransitFactors {
  transitHousesFromLagna: { graha: string; house: number; retrograde: boolean }[];
  exactContacts: Contact[];          // orb ≤ EXACT_ORB, any natal point
  dashaContacts: Contact[];          // any-orb sign-level contacts TO the dasha lords' natal points
  dashaLordTransits: { lord: string; role: "Mahadasha" | "Antardasha"; house: number; sign: string; retrograde: boolean }[];
  tarabala: Tarabala;
  chandrabala: Chandrabala;
}

export function transitFactors(
  chart: FullChart,
  transits: TransitPosition[],
  mahaLord: string,
  antarLord: string
): TransitFactors {
  const contacts = contactsToNatal(transits, chart);
  const moonT = transits.find((t) => t.graha === "Moon");
  const natalMoonNak = Math.floor(norm360(chart.moonLongitude) / NAK_ARC) % 27;
  const lords: { lord: string; role: "Mahadasha" | "Antardasha" }[] = [
    { lord: mahaLord, role: "Mahadasha" },
    ...(antarLord !== mahaLord ? [{ lord: antarLord, role: "Antardasha" as const }] : []),
  ];
  return {
    transitHousesFromLagna: transits.map((t) => ({
      graha: t.graha,
      house: houseOfSign(t.sign, chart.ascSign),
      retrograde: t.retrograde,
    })),
    exactContacts: contacts.filter((c) => c.exact),
    dashaContacts: contacts.filter((c) => lords.some((l) => l.lord === c.natalPoint)),
    dashaLordTransits: lords.flatMap(({ lord, role }) => {
      const t = transits.find((x) => x.graha === lord);
      return t ? [{ lord, role, house: houseOfSign(t.sign, chart.ascSign), sign: t.sign, retrograde: t.retrograde }] : [];
    }),
    tarabala: tarabala(moonT ? moonT.nakshatraIndex : 0, natalMoonNak),
    chandrabala: chandrabala(moonT?.sign ?? "", chart.moonSign),
  };
}

const ord = (n: number): string => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Render the transit block fed verbatim to the AI layer. */
export function renderTransitFactorBlock(f: TransitFactors): string {
  const lines: string[] = [];

  lines.push(
    "Transit houses from the lagna: " +
    f.transitHousesFromLagna
      .map((t) => `${t.graha} ${ord(t.house)}${t.retrograde ? " (R)" : ""}`)
      .join(", ") + "."
  );

  for (const { lord, role, house, sign, retrograde } of f.dashaLordTransits) {
    lines.push(
      `Your ${role} lord ${lord} is currently moving through ${sign} — your ${ord(house)} house ` +
      `(${HOUSE_DOMAINS[house] ?? ""})${retrograde ? ", retrograde" : ""}.`
    );
  }

  if (f.dashaContacts.length > 0) {
    for (const c of f.dashaContacts.slice(0, 3)) {
      lines.push(
        `Dasha activation: transit ${c.transiting} is in ${c.kind} with your natal ${c.natalPoint} ` +
        `(your current dasha lord) — orb ${c.orbDegrees.toFixed(1)}°${c.exact ? ", EXACT" : ""}.`
      );
    }
  }

  const otherExact = f.exactContacts.filter(
    (c) => !f.dashaContacts.some((d) => d.transiting === c.transiting && d.natalPoint === c.natalPoint)
  );
  for (const c of otherExact.slice(0, 4)) {
    lines.push(
      `Exact today: transit ${c.transiting} ${c.kind} natal ${c.natalPoint} (orb ${c.orbDegrees.toFixed(1)}°).`
    );
  }

  lines.push(
    `Tarabala: today is your ${ord(f.tarabala.count)} nakshatra — ${f.tarabala.tara} tara, ${f.tarabala.note}.`
  );
  lines.push(
    `Chandrabala: the Moon is transiting the ${ord(f.chandrabala.houseFromMoon)} from your natal Moon — ${f.chandrabala.quality}.`
  );
  return lines.join("\n");
}
