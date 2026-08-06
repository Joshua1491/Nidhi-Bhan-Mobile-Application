// Insights — app-exclusive: mood trend + practice streaks from your own logs.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { getJourney } from "../../../lib/content/journeys";
import { getRemedy } from "../../../lib/content/remedies";
import type { JourneyProgress, MoodLog, RemedyProgress } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

const MOOD_WORDS = ["", "Heavy", "Low", "Steady", "Bright", "Radiant"];
const MOOD_COLORS = ["", "#7E8AA0", "#9A90A3", "#C4A0B9", "#C5A66B", "#D4A0A0"];

export default function Insights() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const data = useQuery({
    queryKey: ["insights", userId],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [moods, journeys, remedies] = await Promise.all([
        supabase.from("mood_logs").select("log_date, mood, energy, note")
          .eq("user_id", userId).gte("log_date", since.toISOString().slice(0, 10))
          .order("log_date", { ascending: true }),
        supabase.from("journey_progress").select("journey_slug, current_day, completed_days, streak, last_completed_date, status").eq("user_id", userId),
        supabase.from("remedy_progress").select("remedy_slug, streak, total_done, last_done_date, status").eq("user_id", userId),
      ]);
      return {
        moods: (moods.data ?? []) as MoodLog[],
        journeys: (journeys.data ?? []) as JourneyProgress[],
        remedies: (remedies.data ?? []) as RemedyProgress[],
      };
    },
  });

  if (data.isLoading) return <Screen><Loading /></Screen>;
  const { moods, journeys, remedies } = data.data!;
  const avg = moods.length ? moods.reduce((s, m) => s + m.mood, 0) / moods.length : 0;

  return (
    <Screen refreshing={data.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["insights", userId] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Insights</Eyebrow>
        <Title>What your last{"\n"}30 days are saying</Title>
      </View>

      {/* Mood trend */}
      <View>
        <SectionLabel>Mood check-ins · {moods.length} day{moods.length === 1 ? "" : "s"} logged</SectionLabel>
        <Card>
          {moods.length ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 96 }}>
                {moods.slice(-30).map((m) => (
                  <View key={m.log_date} style={{
                    flex: 1, height: 14 + (m.mood / 5) * 78, borderRadius: 4,
                    backgroundColor: MOOD_COLORS[m.mood],
                  }} />
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}>
                  Averaging <Text style={{ fontFamily: fonts.sansMedium, color: colors.warmGold }}>{MOOD_WORDS[Math.round(avg)]}</Text>
                </Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted }}>
                  {moods[0].log_date.slice(5)} → {moods[moods.length - 1].log_date.slice(5)}
                </Text>
              </View>
            </>
          ) : (
            <Sub style={{ marginTop: 0 }}>No check-ins yet — log today's mood on the Today tab and your trend will grow here.</Sub>
          )}
        </Card>
      </View>

      {/* Journey streaks */}
      <View>
        <SectionLabel>Journeys</SectionLabel>
        {journeys.length ? (
          <View style={{ gap: 12 }}>
            {journeys.map((j) => {
              const meta = getJourney(j.journey_slug);
              if (!meta) return null;
              const pct = Math.min(100, Math.round((j.completed_days / meta.totalDays) * 100));
              return (
                <Card key={j.journey_slug}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Serif size={18}>{meta.title}</Serif>
                    <Text style={{ fontFamily: fonts.serifLight, fontSize: 24, color: meta.accent }}>
                      {j.streak}<Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.textMuted }}> streak</Text>
                    </Text>
                  </View>
                  <View style={{ marginTop: 10, height: 5, borderRadius: 3, backgroundColor: "rgba(197,166,107,0.12)", overflow: "hidden" }}>
                    <View style={{ width: `${Math.max(2, pct)}%`, height: 5, backgroundColor: meta.accent }} />
                  </View>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
                    {j.completed_days} of {meta.totalDays} days · {j.status === "complete" ? "complete ✦" : "active"}
                  </Text>
                </Card>
              );
            })}
          </View>
        ) : (
          <Sub>No journeys started yet — the Journeys tab is where reconditioning begins.</Sub>
        )}
      </View>

      {/* Remedy streaks */}
      <View>
        <SectionLabel>Remedies</SectionLabel>
        {remedies.length ? (
          <Card>
            {remedies.map((r, i) => {
              const meta = getRemedy(r.remedy_slug);
              if (!meta) return null;
              return (
                <View key={r.remedy_slug} style={{ paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.cardBorder }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary }}>{meta.title}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{meta.cadence}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}>
                    {r.total_done} done · <Text style={{ color: meta.accent, fontFamily: fonts.sansMedium }}>{r.streak} streak</Text>
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : (
          <Sub>Nothing tracked yet — add a remedy to your plan from Explore → Remedies.</Sub>
        )}
      </View>
    </Screen>
  );
}
