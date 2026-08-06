// ============================================================
// Client for the website's /api/app/* routes. Secrets (Anthropic,
// VedAstro) live server-side; we authenticate with the Supabase JWT.
// ============================================================
import { supabase } from "./supabase";

export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.drnidhibhan.com";

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const res = await fetch(`${SITE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface GeoResult { lat: number; lon: number; tz: number }

/** Geocode a birth/event place (VedAstro key stays on the server). */
export function geocodePlace(place: string, date?: string | null) {
  return post<GeoResult>("/api/app/geocode", { place, date });
}

/** Ask the server to (re)compute + cache the canonical chart bundle. */
export function refreshAstroBundle() {
  return post<{ ok: boolean }>("/api/app/astro/bundle", {});
}

export type AIKind =
  | "daily" | "horizon" | "remedies" | "journeys"
  | "compat" | "chart-insight" | "journal-prompt" | "festival-note";

/** Fetch an AI-personalized reading (server-side cached per user/day). */
export function aiReading<T>(kind: AIKind, extra?: Record<string, unknown>) {
  return post<T>("/api/app/ai", { kind, ...(extra ?? {}) });
}

/** Permanently delete the signed-in user's account + data (App Store 5.1.1v). */
export function deleteAccount() {
  return post<{ ok?: boolean; error?: string }>("/api/app/account/delete", {});
}
