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

// ── Booking — the same wiring as the website's client booking ──

export interface SlotDay {
  date: string;
  slots: { startMs: number }[];
}
export interface SlotsResponse {
  service: { id: string; name: string; durationMin: number };
  clientTimeZone: string;
  days: SlotDay[];
}

/** Free times for a service, grouped by the client's own timezone. */
export function bookableSlots(service: string) {
  return post<SlotsResponse>("/api/app/slots", { service });
}

export interface BookResult {
  ok: boolean;
  message: string;
  appointmentId?: string;
}

/**
 * Book a slot. Unlike `post`, a non-OK answer here still carries the
 * sentence the person needs to read ("Someone just took that time"),
 * so this one keeps the body instead of collapsing it to null.
 */
export async function bookAppointment(serviceId: string, startMs: number): Promise<BookResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, message: "Please sign in again." };
    const res = await fetch(`${SITE_URL}/api/app/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ service_id: serviceId, start: new Date(startMs).toISOString() }),
    });
    const body = (await res.json().catch(() => null)) as BookResult | null;
    return body ?? { ok: false, message: "We couldn't reach the booking service. Please try again." };
  } catch {
    return { ok: false, message: "We couldn't reach the booking service. Please try again." };
  }
}
