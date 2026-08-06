// ============================================================
// Assembles the astro bundle on-device from the DB-cached canonical
// chart (computed server-side via VedAstro). If the cache is empty
// (fresh birth details), we ask the server to compute it once.
// Mirrors src/lib/astro/source.ts on the website.
// ============================================================
import { supabase } from "../supabase";
import { refreshAstroBundle } from "../api";
import { getBirthChart, type BirthInput, type DashaState, type SadeSati } from "../astro/engine";
import type { FullChart } from "../astro/fullchart";
import type { BirthRow, Bundle, Profile } from "./types";

const PLACEHOLDER_DASHA: DashaState = {
  mahaLord: "—", mahaTheme: "", mahaStartYear: 0, mahaEndYear: 0,
  mahaEndLabel: "—", progressPct: 0, antarLord: "—", antarEndLabel: "—", nextLord: "—",
};
const PLACEHOLDER_SADE: SadeSati = {
  active: false, phase: "none", phaseLabel: "Temporarily unavailable",
  monthsRemaining: 0, turnLabel: "",
  message: "We couldn't reach the chart service just now. Please try again in a moment.",
};

export function toBirthChart(full: FullChart) {
  return {
    hasData: true,
    moonSign: full.moonSign,
    sunSign: full.sunSign,
    ascendant: full.ascSign,
    nakshatra: full.moonNakshatra,
    nakshatraPada: full.moonNakshatraPada,
    birthSummary: full.birthSummary,
  };
}

export async function loadProfileAndBirth(userId: string): Promise<{ profile: Profile | null; birth: BirthRow | null; input: BirthInput }> {
  const [{ data: profile }, { data: birth }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, onboarded").eq("id", userId).maybeSingle(),
    supabase.from("birth_details").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  const input: BirthInput = {
    birth_date: birth?.birth_date ?? null,
    birth_time: birth?.birth_time ?? null,
    birth_place: birth?.birth_place ?? null,
    full_name: profile?.full_name ?? null,
  };
  return { profile: (profile as Profile) ?? null, birth: (birth as BirthRow) ?? null, input };
}

function fromRow(row: BirthRow): Bundle | null {
  if (!row.full_chart || !row.dasha || !row.sade_sati) return null;
  return {
    chart: row.chart ?? toBirthChart(row.full_chart),
    full: row.full_chart,
    dasha: row.dasha,
    sade: row.sade_sati,
    source: "live",
    coords:
      row.latitude != null && row.longitude != null
        ? { lat: row.latitude, lon: row.longitude, tz: Number(row.tz_offset ?? 0) }
        : null,
  };
}

export async function getBundle(userId: string): Promise<{ bundle: Bundle; profile: Profile | null; birth: BirthRow | null; input: BirthInput }> {
  const { profile, birth, input } = await loadProfileAndBirth(userId);

  // No birth details yet — friendly prompt state, never a fake chart.
  if (!input.birth_date || !input.birth_place || !birth) {
    return {
      profile, birth, input,
      bundle: { chart: getBirthChart(input), full: null, dasha: PLACEHOLDER_DASHA, sade: PLACEHOLDER_SADE, source: "sample", coords: null },
    };
  }

  const cached = fromRow(birth);
  if (cached) return { bundle: cached, profile, birth, input };

  // Cache is cold (new details) — server computes via VedAstro + caches.
  const ok = await refreshAstroBundle();
  if (ok?.ok) {
    const again = await loadProfileAndBirth(userId);
    const fresh = again.birth ? fromRow(again.birth) : null;
    if (fresh) return { bundle: fresh, profile: again.profile, birth: again.birth, input: again.input };
  }

  const coords =
    birth.latitude != null && birth.longitude != null
      ? { lat: birth.latitude, lon: birth.longitude, tz: Number(birth.tz_offset ?? 0) }
      : null;
  return {
    profile, birth, input,
    bundle: {
      chart: {
        hasData: true, moonSign: "—", sunSign: "—", ascendant: "—", nakshatra: "—", nakshatraPada: 1,
        birthSummary: "Your chart is being prepared — pull to refresh in a moment.",
      },
      full: null, dasha: PLACEHOLDER_DASHA, sade: PLACEHOLDER_SADE, source: "unavailable", coords,
    },
  };
}
