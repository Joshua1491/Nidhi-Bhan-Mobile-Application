// ============================================================
// Local timing engine — panchang, sunrise/sunset and the day's
// inauspicious/auspicious windows, computed OURSELVES from a real
// ephemeris (astronomy-engine) + Lahiri ayanamsa. No per-day API
// calls: instant, offline, deterministic, and location-correct.
//
// Cross-checked against VedAstro: our sidereal Moon matches to
// ~0.005°. This is the Layer-0 ground truth from the accuracy doc.
// ============================================================

import * as Astronomy from "astronomy-engine";
import { NAKSHATRAS, TITHIS } from "./data";

const NAK_ARC = 360 / 27;

// ---- ayanamsa & sidereal positions ----

/** Lahiri ayanamsa in degrees: 23.85° at J2000, precessing ~50.2388"/yr. */
export function lahiriAyanamsa(date: Date): number {
  const JD = 2440587.5 + date.getTime() / 86400000;
  const T = (JD - 2451545.0) / 365.25; // years from J2000
  return 23.85 + T * (50.2388 / 3600);
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Geocentric sidereal (Lahiri) ecliptic longitudes of the Sun and Moon. */
export function sunMoonSidereal(date: Date): { sun: number; moon: number; ayanamsa: number } {
  const ay = lahiriAyanamsa(date);
  const moonTrop = Astronomy.EclipticGeoMoon(date).lon;
  const sunTrop = Astronomy.SunPosition(date).elon;
  return { sun: norm360(sunTrop - ay), moon: norm360(moonTrop - ay), ayanamsa: ay };
}

// ---- panchang (reckoned at sunrise) ----

const VARAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
  "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
  "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
  "Shukla", "Brahma", "Indra", "Vaidhriti",
];

export interface Panchang {
  weekday: string;
  weekdayIndex: number; // 0=Sun
  tithi: string;
  tithiIndex: number; // 0..29
  paksha: string;
  nakshatra: string;
  nakshatraIndex: number; // 0..26
  nakshatraPada: number;
  yoga: string;
  moonSign: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Panchang at a given instant (pass local sunrise for the classical day reckoning). */
export function panchangAt(instant: Date): Panchang {
  const { sun, moon } = sunMoonSidereal(instant);
  // Tithi: lunar phase angle (Moon − Sun), 12° each. Ayanamsa cancels in the diff.
  const phase = norm360(moon - sun);
  const tithiIndex = Math.floor(phase / 12); // 0..29
  const paksha = tithiIndex < 15 ? "Shukla Paksha (waxing)" : "Krishna Paksha (waning)";
  // Nakshatra & pada from sidereal Moon.
  const nakIndex = Math.floor(moon / NAK_ARC) % 27;
  const pada = Math.floor((moon % NAK_ARC) / (NAK_ARC / 4)) + 1;
  // Yoga: (Moon + Sun) sidereal, 27 divisions.
  const yogaIndex = Math.floor(norm360(moon + sun) / NAK_ARC) % 27;
  const weekdayIndex = instant.getUTCDay(); // computed on the local-sunrise instant
  return {
    weekday: VARAS[weekdayIndex],
    weekdayIndex,
    tithi: TITHIS[tithiIndex % 15],
    tithiIndex,
    paksha,
    nakshatra: NAKSHATRAS[nakIndex],
    nakshatraIndex: nakIndex,
    nakshatraPada: pada,
    yoga: YOGA_NAMES[yogaIndex],
    moonSign: SIGNS[Math.floor(moon / 30) % 12],
  };
}

// ---- sunrise / sunset / day windows ----

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
}

/** Sunrise & sunset for a location on a local calendar date. */
export function sunTimes(lat: number, lon: number, localMidnight: Date): SunTimes {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, localMidnight, 1);
  const set = rise ? Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, rise.date, 1) : null;
  return { sunrise: rise ? rise.date : null, sunset: set ? set.date : null };
}

export interface DayWindow {
  name: string;
  start: Date;
  end: Date;
  kind: "avoid" | "auspicious";
}

// Which eighth of the daytime (1-based) each weekday's window falls in.
const RAHU_EIGHTH = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat
const YAMA_EIGHTH = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_EIGHTH = [7, 6, 5, 4, 3, 2, 1];

function eighthWindow(sunrise: Date, dayMs: number, eighth1: number, name: string, kind: DayWindow["kind"]): DayWindow {
  const slice = dayMs / 8;
  const start = new Date(sunrise.getTime() + (eighth1 - 1) * slice);
  return { name, start, end: new Date(start.getTime() + slice), kind };
}

/** The day's key windows for a location/date. Empty if sun never rises/sets. */
export function dayWindows(lat: number, lon: number, localMidnight: Date): {
  sunrise: Date | null;
  sunset: Date | null;
  windows: DayWindow[];
} {
  const { sunrise, sunset } = sunTimes(lat, lon, localMidnight);
  if (!sunrise || !sunset) return { sunrise, sunset, windows: [] };
  const dayMs = sunset.getTime() - sunrise.getTime();
  const wd = sunrise.getUTCDay(); // weekday at sunrise (UTC day of the local-sunrise instant)

  const windows: DayWindow[] = [
    eighthWindow(sunrise, dayMs, RAHU_EIGHTH[wd], "Rahu Kaal", "avoid"),
    eighthWindow(sunrise, dayMs, YAMA_EIGHTH[wd], "Yamaganda", "avoid"),
    eighthWindow(sunrise, dayMs, GULIKA_EIGHTH[wd], "Gulika Kaal", "avoid"),
  ];
  // Abhijit Muhurta: the 8th of 15 daytime muhurtas (straddles solar noon).
  const muhurtaMs = dayMs / 15;
  const abhijitStart = new Date(sunrise.getTime() + 7 * muhurtaMs);
  windows.push({ name: "Abhijit Muhurta", start: abhijitStart, end: new Date(abhijitStart.getTime() + muhurtaMs), kind: "auspicious" });
  // Brahma Muhurta: ~96–48 min before sunrise.
  windows.push({ name: "Brahma Muhurta", start: new Date(sunrise.getTime() - 96 * 60000), end: new Date(sunrise.getTime() - 48 * 60000), kind: "auspicious" });

  return { sunrise, sunset, windows };
}

/** Format a window as a local clock string for a given tz offset (hours). */
export function fmtWindow(w: { start: Date; end: Date }, tzHours: number): string {
  return `${fmtClock(w.start, tzHours)} – ${fmtClock(w.end, tzHours)}`;
}
export function fmtClock(d: Date, tzHours: number): string {
  const local = new Date(d.getTime() + tzHours * 3600000);
  let h = local.getUTCHours();
  const m = local.getUTCMinutes();
  const ap = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Build the local-midnight instant for a Y-M-D at a tz offset (hours). */
export function localMidnight(year: number, month0: number, day: number, tzHours: number): Date {
  const sign = tzHours < 0 ? "-" : "+";
  const a = Math.abs(tzHours);
  const hh = String(Math.floor(a)).padStart(2, "0");
  const mm = String(Math.round((a - Math.floor(a)) * 60)).padStart(2, "0");
  const ymd = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return new Date(`${ymd}T00:00:00${sign}${hh}:${mm}`);
}
