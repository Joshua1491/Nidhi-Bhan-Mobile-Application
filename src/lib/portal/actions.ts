// ============================================================
// Client-side ports of the portal's server actions. All writes go
// through Supabase RLS with the signed-in user.
// ============================================================
import { supabase } from "../supabase";
import { geocodePlace } from "../api";

const todayStr = () => new Date().toISOString().slice(0, 10);
function yesterdayStr() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return y.toISOString().slice(0, 10);
}

export async function logMood(userId: string, mood: number, energy: number | null, note: string | null) {
  if (!mood || mood < 1 || mood > 5) return;
  await supabase.from("mood_logs").upsert(
    { user_id: userId, log_date: todayStr(), mood, energy, note },
    { onConflict: "user_id,log_date" }
  );
}

export async function startJourney(userId: string, slug: string) {
  await supabase.from("journey_progress").upsert(
    { user_id: userId, journey_slug: slug, current_day: 1, completed_days: 0, streak: 0, status: "active" },
    { onConflict: "user_id,journey_slug", ignoreDuplicates: true }
  );
}

export async function completeJourneyDay(userId: string, slug: string, totalDays: number) {
  const { data: row } = await supabase
    .from("journey_progress")
    .select("current_day, completed_days, streak, last_completed_date, status")
    .eq("user_id", userId).eq("journey_slug", slug).maybeSingle();

  const today = todayStr();
  if (row?.last_completed_date === today) return;

  const newStreak = row?.last_completed_date === yesterdayStr() ? (row.streak ?? 0) + 1 : 1;
  const completed = (row?.completed_days ?? 0) + 1;
  const cap = totalDays > 0 ? totalDays : Infinity;
  const nextDay = Math.min(cap, (row?.current_day ?? 1) + 1);
  const status = totalDays && completed >= totalDays ? "complete" : "active";

  await supabase.from("journey_progress").update({
    completed_days: completed,
    current_day: nextDay === Infinity ? completed + 1 : nextDay,
    streak: newStreak, last_completed_date: today, status,
  }).eq("user_id", userId).eq("journey_slug", slug);
}

export async function addRemedy(userId: string, slug: string) {
  await supabase.from("remedy_progress").upsert(
    { user_id: userId, remedy_slug: slug, status: "active" },
    { onConflict: "user_id,remedy_slug", ignoreDuplicates: true }
  );
}

export async function completeRemedyToday(userId: string, slug: string) {
  const { data: row } = await supabase
    .from("remedy_progress").select("streak, total_done, last_done_date")
    .eq("user_id", userId).eq("remedy_slug", slug).maybeSingle();
  const today = todayStr();
  if (row?.last_done_date === today) return;
  const newStreak = row?.last_done_date === yesterdayStr() ? (row.streak ?? 0) + 1 : 1;
  await supabase.from("remedy_progress").update({
    streak: newStreak, total_done: (row?.total_done ?? 0) + 1, last_done_date: today,
  }).eq("user_id", userId).eq("remedy_slug", slug);
}

export async function removeRemedy(userId: string, slug: string) {
  await supabase.from("remedy_progress").delete()
    .eq("user_id", userId).eq("remedy_slug", slug);
}

export async function addJournalEntry(userId: string, content: string, prompt: string | null) {
  if (!content.trim()) return;
  await supabase.from("journal_entries").insert({
    user_id: userId, entry_date: todayStr(), prompt, content: content.trim(),
  });
}

export async function deleteJournalEntry(userId: string, id: string) {
  await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", userId);
}

/** Update birth details; re-geocodes and clears the cached chart (server recomputes). */
export async function updateBirthDetails(
  userId: string,
  d: { birth_date: string | null; birth_time: string | null; birth_place: string | null; gender?: string | null }
) {
  const geo = d.birth_place ? await geocodePlace(d.birth_place, d.birth_date) : null;
  const { error } = await supabase.from("birth_details").upsert(
    {
      user_id: userId,
      birth_date: d.birth_date, birth_time: d.birth_time, birth_place: d.birth_place,
      ...(d.gender !== undefined ? { gender: d.gender } : {}),
      latitude: geo?.lat ?? null, longitude: geo?.lon ?? null, tz_offset: geo?.tz ?? null,
      chart: null, dasha: null, sade_sati: null, astro_computed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return { error: error?.message ?? null };
}

export async function markOnboarded(userId: string) {
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, onboarded: true, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  return { error: error?.message ?? null };
}

export async function getFlags(): Promise<Record<string, boolean>> {
  const { data } = await supabase.from("feature_flags").select("key, enabled");
  const map: Record<string, boolean> = {};
  (data ?? []).forEach((r: { key: string; enabled: boolean }) => { map[r.key] = r.enabled; });
  return map;
}
