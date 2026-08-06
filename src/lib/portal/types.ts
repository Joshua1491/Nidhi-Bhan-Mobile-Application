import type { BirthChart, DashaState, SadeSati } from "../astro/engine";
import type { FullChart } from "../astro/fullchart";

export interface Profile {
  id: string;
  full_name: string | null;
  onboarded: boolean;
}

export interface BirthRow {
  user_id: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  gender: string | null;
  latitude: number | null;
  longitude: number | null;
  tz_offset: number | null;
  full_chart: FullChart | null;
  chart: BirthChart | null;
  dasha: DashaState | null;
  sade_sati: SadeSati | null;
  astro_computed_at: string | null;
}

export type AstroSource = "live" | "sample" | "unavailable";

export interface Bundle {
  chart: BirthChart;
  full: FullChart | null;
  dasha: DashaState;
  sade: SadeSati;
  source: AstroSource;
  coords: { lat: number; lon: number; tz: number } | null;
}

export interface MoodLog { log_date: string; mood: number; energy: number | null; note: string | null }

export interface JourneyProgress {
  journey_slug: string;
  current_day: number;
  completed_days: number;
  streak: number;
  last_completed_date: string | null;
  status: string;
}

export interface RemedyProgress {
  remedy_slug: string;
  streak: number;
  total_done: number;
  last_done_date: string | null;
  status: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  prompt: string | null;
  content: string;
  created_at: string;
}

export interface SessionNote {
  id: string;
  title: string | null;
  body: string;
  session_type: string | null;
  session_date: string | null;
  created_at: string;
}
