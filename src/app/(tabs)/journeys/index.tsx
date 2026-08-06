// Journeys — multi-day reconditioning programs with per-user progress.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Card, Eyebrow, Loading, Screen, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import type { AIJourneysReading } from "../../../lib/portal/ai-types";
import { getBundle } from "../../../lib/portal/bundle";
import { JOURNEYS } from "../../../lib/content/journeys";
import { startJourney } from "../../../lib/portal/actions";
import type { JourneyProgress } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function Journeys() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const progress = useQuery({
    queryKey: ["journeys", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("journey_progress")
        .select("journey_slug, current_day, completed_days, streak, last_completed_date, status")
        .eq("user_id", userId);
      const map: Record<string, JourneyProgress> = {};
      (data ?? []).forEach((r: JourneyProgress) => { map[r.journey_slug] = r; });
      return map;
    },
  });

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const ai = useQuery({
    queryKey: ["ai-journeys", userId, portal.data?.bundle.dasha.mahaLord],
    queryFn: () => aiReading<AIJourneysReading>("journeys"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: Infinity,
  });

  if (progress.isLoading) return <Screen><Loading /></Screen>;
  const map = progress.data ?? {};

  async function open(slug: string, started: boolean) {
    if (!started) {
      await startJourney(userId, slug);
      qc.invalidateQueries({ queryKey: ["journeys", userId] });
    }
    router.push(`/journeys/${slug}`);
  }

  return (
    <Screen refreshing={progress.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["journeys", userId] })}>
      <View>
        <Eyebrow>Reconditioning journeys</Eyebrow>
        <Title>Rewrite the script{"\n"}underneath</Title>
        <Sub>Multi-day subliminal and affirmation programs led by Dr. Nidhi — a few quiet minutes a day.</Sub>
      </View>

      {ai.data ? (
        <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
          <Eyebrow>For this chapter of yours</Eyebrow>
          <Body style={{ marginTop: 8 }}>{ai.data.intro}</Body>
          {ai.data.recommendation ? (
            <Body style={{ marginTop: 8, fontFamily: fonts.sansMedium }}>{ai.data.recommendation}</Body>
          ) : null}
        </Card>
      ) : null}

      {JOURNEYS.map((j) => {
        const p = map[j.slug];
        const pct = p ? Math.min(100, Math.round((p.completed_days / j.totalDays) * 100)) : 0;
        return (
          <Pressable key={j.slug} onPress={() => open(j.slug, Boolean(p))}>
            <Card tint={j.tint} borderColor={`${j.accent}44`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2.2, textTransform: "uppercase", color: j.accent }}>
                  {j.theme} · {j.durationLabel}
                </Text>
                {j.premium ? (
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.5, color: colors.warmGold }}>PREMIUM</Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: fonts.serifMedium, fontSize: 24, color: colors.charcoal, marginTop: 6 }}>{j.title}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary, marginTop: 4 }}>{j.subtitle}</Text>
              {p ? (
                <View style={{ marginTop: 14 }}>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.85)", overflow: "hidden" }}>
                    <View style={{ width: `${Math.max(2, pct)}%`, height: 5, backgroundColor: j.accent }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted }}>
                      {p.status === "complete" ? "Complete ✦" : `Day ${p.current_day} of ${j.totalDays}`}
                    </Text>
                    {p.streak > 1 ? (
                      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: j.accent }}>{p.streak}-day streak</Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: j.accent, marginTop: 12 }}>
                  Begin → {j.dailyMinutes} min/day
                </Text>
              )}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
