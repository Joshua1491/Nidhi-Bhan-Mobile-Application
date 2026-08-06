// ============================================================
// Canonical natal chart — the single source of truth for every
// page. Built ONCE from raw VedAstro planet data, validated, and
// cached on birth_details.full_chart. Pages never re-derive chart
// facts; they read this object.
//
// This file is pure (no network): types + parsers + helpers that
// turn a VedAstro AllPlanetData payload into our normalized shape.
// The fetch layer lives in vedastro.ts.
// ============================================================

export const GRAHAS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
] as const;
export type Graha = (typeof GRAHAS)[number];

// Nakshatra lords in order (Ashwini → Revati), cycling every 9.
export const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

// VedAstro field name for each divisional (varga) chart sign.
export const VARGA_FIELDS: { code: string; name: string; field: string }[] = [
  { code: "D1", name: "Rasi (body / overall)", field: "PlanetRasiD1Sign" },
  { code: "D2", name: "Hora (wealth)", field: "PlanetHoraD2Signs" },
  { code: "D3", name: "Drekkana (siblings, courage)", field: "PlanetDrekkanaD3Sign" },
  { code: "D4", name: "Chaturthamsha (home, fortune)", field: "PlanetChaturthamshaD4Sign" },
  { code: "D7", name: "Saptamsha (children)", field: "PlanetSaptamshaD7Sign" },
  { code: "D9", name: "Navamsha (spouse, dharma)", field: "PlanetNavamshaD9Sign" },
  { code: "D10", name: "Dashamamsha (career)", field: "PlanetDashamamshaD10Sign" },
  { code: "D12", name: "Dwadashamsha (parents)", field: "PlanetDwadashamshaD12Sign" },
  { code: "D16", name: "Shodashamsha (vehicles, comforts)", field: "PlanetShodashamshaD16Sign" },
  { code: "D20", name: "Vimshamsha (spiritual practice)", field: "PlanetVimshamshaD20Sign" },
  { code: "D24", name: "Chaturvimshamsha (learning)", field: "PlanetChaturvimshamshaD24Sign" },
  { code: "D27", name: "Bhamsha (strengths, weaknesses)", field: "PlanetBhamshaD27Sign" },
  { code: "D30", name: "Trimshamsha (misfortunes)", field: "PlanetTrimshamshaD30Sign" },
  { code: "D40", name: "Khavedamsha (auspicious effects)", field: "PlanetKhavedamshaD40Sign" },
  { code: "D45", name: "Akshavedamsha (character)", field: "PlanetAkshavedamshaD45Sign" },
  { code: "D60", name: "Shashtyamsha (past karma / all)", field: "PlanetShashtyamshaD60Sign" },
];

export type Dignity =
  | "Exalted"
  | "Debilitated"
  | "Moolatrikona"
  | "Own sign"
  | "Friend"
  | "Enemy"
  | "Neutral";

export interface PlanetPosition {
  graha: string;
  sign: string; // D1 rasi
  signDegrees: number; // 0–30 within sign
  longitude: number; // 0–360 sidereal (Lahiri)
  nakshatra: string;
  nakshatraPada: number;
  nakshatraLord: string;
  house: number; // 1–12 from ascendant (whole-sign)
  retrograde: boolean;
  combust: boolean;
  dignity: Dignity;
  vargas: Record<string, string>; // { D1: "Pisces", D9: "Aquarius", ... }
}

export interface FullChart {
  hasData: true;
  ayanamsa: number; // sidereal correction in degrees (sanity-checked)
  ascendant: { sign: string; degrees: number };
  planets: PlanetPosition[];
  // convenience mirrors used across the app
  moonSign: string;
  sunSign: string;
  ascSign: string;
  moonNakshatra: string;
  moonNakshatraPada: number;
  moonLongitude: number;
  birthSummary: string;
  computedAt: string;
}

// ---------- parsing helpers (pure) ----------

function obj(v: unknown): Record<string, unknown> {
  return (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
}
function signName(v: unknown): string {
  return String(obj(v).Name ?? "").trim();
}
function totalDeg(v: unknown): number {
  return Number(obj(obj(v).DegreesIn).TotalDegrees);
}
function boolish(v: unknown): boolean {
  return String(v).toLowerCase() === "true";
}

export function nakshatraIndexFromLongitude(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  return Math.floor(lon / (360 / 27)) % 27;
}

export function nakshatraLordFromLongitude(longitude: number): string {
  return NAKSHATRA_LORDS[nakshatraIndexFromLongitude(longitude) % 9];
}

function deriveDignity(d: Record<string, unknown>): Dignity {
  if (boolish(d.IsPlanetExalted) || boolish(d.IsPlanetExaltedSign)) return "Exalted";
  if (boolish(d.IsPlanetDebilitated)) return "Debilitated";
  if (boolish(d.IsPlanetInMoolatrikona)) return "Moolatrikona";
  if (boolish(d.IsPlanetInOwnSign) || boolish(d.IsPlanetInOwnHouse)) return "Own sign";
  if (boolish(d.IsPlanetInFriendSign)) return "Friend";
  if (boolish(d.IsPlanetInEnemySign)) return "Enemy";
  return "Neutral";
}

function houseNumber(v: unknown): number {
  const m = String(v).match(/House(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** Parse one VedAstro AllPlanetData payload (the `.AllPlanetData` object). */
export function parsePlanet(graha: string, allPlanetData: unknown): PlanetPosition {
  const d = obj(allPlanetData);
  const longitude = Number(obj(d.PlanetNirayanaLongitude).TotalDegrees);
  const [nak, padaRaw] = String(d.PlanetConstellation ?? "").split(" - ");
  const vargas: Record<string, string> = {};
  for (const v of VARGA_FIELDS) {
    const s = signName(d[v.field]);
    if (s) vargas[v.code] = s;
  }
  return {
    graha,
    sign: signName(d.PlanetRasiD1Sign),
    signDegrees: totalDeg(d.PlanetRasiD1Sign),
    longitude,
    nakshatra: (nak ?? "").trim(),
    nakshatraPada: Number((padaRaw ?? "").trim()) || 1,
    nakshatraLord: isFinite(longitude) ? nakshatraLordFromLongitude(longitude) : "",
    house: houseNumber(d.HousePlanetOccupiesBasedOnSign),
    retrograde: boolish(d.IsPlanetRetrograde),
    combust: boolish(d.IsPlanetCombust),
    dignity: deriveDignity(d),
    vargas,
  };
}

/** Ayanamsa = tropical(Sayana) − sidereal(Nirayana), normalized to [0,360). */
export function deriveAyanamsa(allPlanetData: unknown): number {
  const d = obj(allPlanetData);
  const sayana = Number(obj(d.PlanetSayanaLongitude).TotalDegrees);
  const nirayana = Number(obj(d.PlanetNirayanaLongitude).TotalDegrees);
  if (!isFinite(sayana) || !isFinite(nirayana)) return NaN;
  return ((sayana - nirayana) % 360 + 360) % 360;
}

/** Assemble a FullChart from parsed planets + ascendant. */
export function assembleChart(
  planets: PlanetPosition[],
  ascendant: { sign: string; degrees: number },
  ayanamsa: number
): FullChart {
  const moon = planets.find((p) => p.graha === "Moon");
  const sun = planets.find((p) => p.graha === "Sun");
  return {
    hasData: true,
    ayanamsa,
    ascendant,
    planets,
    moonSign: moon?.sign ?? "—",
    sunSign: sun?.sign ?? "—",
    ascSign: ascendant.sign || "—",
    moonNakshatra: moon?.nakshatra ?? "—",
    moonNakshatraPada: moon?.nakshatraPada ?? 1,
    moonLongitude: moon?.longitude ?? NaN,
    birthSummary: `Moon in ${moon?.sign ?? "—"}, ${moon?.nakshatra ?? "—"} nakshatra, ${ascendant.sign || "—"} rising.`,
    computedAt: new Date().toISOString(),
  };
}
