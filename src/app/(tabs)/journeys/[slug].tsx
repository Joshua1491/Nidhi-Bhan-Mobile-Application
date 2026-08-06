import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import PracticePlayer from "../../../components/PracticePlayer";
import { Btn, Card, Loading, Screen, SectionLabel, Serif, Sub } from "../../../components/ui";
import { getJourney } from "../../../lib/content/journeys";
import { completeJourneyDay } from "../../../lib/portal/actions";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function JourneyDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const journey = getJourney(String(slug));

  const progress = useQuery({
    queryKey: ["journey", userId, slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("journey_progress")
        .select("current_day, completed_days, streak, last_completed_date, status")
        .eq("user_id", userId).eq("journey_slug", String(slug)).maybeSingle();
      return data;
    },
  });

  if (!journey) return <Screen><Sub>Journey not found.</Sub></Screen>;
  if (progress.isLoading) return <Screen><Loading /></Screen>;
  const p = progress.data;
  if (!p) { router.replace("/journeys"); return null; }

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = p.last_completed_date === today;
  const isComplete = p.status === "complete";
  const pct = Math.min(100, Math.round((p.completed_days / journey.totalDays) * 100));
  const dayNum = Math.min(p.completed_days + (doneToday ? 0 : 1), journey.totalDays);

  async function complete() {
    await completeJourneyDay(userId, journey!.slug, journey!.totalDays);
    qc.invalidateQueries({ queryKey: ["journey", userId, slug] });
    qc.invalidateQueries({ queryKey: ["journeys", userId] });
  }

  return (
    <Screen refreshing={progress.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["journey", userId, slug] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← All journeys</Text>
      </Pressable>

      {/* Hero */}
      <Card tint={journey.tint} borderColor={`${journey.accent}33`}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: colors.textMuted }}>
          {journey.theme} · {journey.durationLabel}
        </Text>
        <Serif size={30} style={{ marginTop: 6 }}>{journey.title}</Serif>
        <Text style={{ fontFamily: fonts.serif, fontSize: 15.5, fontStyle: "italic", color: colors.textSecondary, marginTop: 4 }}>
          {journey.promise}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted }}>Day {dayNum} of {journey.totalDays}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted }}>{pct}%</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)", overflow: "hidden" }}>
              <View style={{ width: `${Math.max(2, pct)}%`, height: 8, backgroundColor: journey.accent, borderRadius: 4 }} />
            </View>
          </View>
          {p.streak > 0 ? (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.serifLight, fontSize: 28, color: journey.accent }}>{p.streak}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: colors.textMuted }}>day streak</Text>
            </View>
          ) : null}
        </View>
      </Card>

      {/* Today's session / complete state */}
      {isComplete ? (
        <Card tint={`${journey.accent}14`} borderColor={`${journey.accent}44`} style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 28 }}>✦</Text>
          <Serif size={24} style={{ marginTop: 4 }}>Journey complete</Serif>
          <Sub style={{ textAlign: "center" }}>
            You showed up for yourself {journey.totalDays} days running. That consistency is the
            real reconditioning. Notice what feels different.
          </Sub>
        </Card>
      ) : (
        <View>
          <SectionLabel>{doneToday ? "Today — complete" : "Today's session"}</SectionLabel>
          <PracticePlayer
            title={`Day ${dayNum} · ${journey.title}`}
            minutes={journey.dailyMinutes}
            kind="Subliminal session"
            note={journey.subtitle}
            script={`Find a quiet place. Close your eyes. Let Dr. Nidhi's words move past the thinking mind and settle where the old pattern lives. ${journey.promise}`}
          />
          <View style={{ marginTop: 12 }}>
            {doneToday ? (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: journey.accent, textAlign: "center" }}>
                ✓ Logged for today. Come back tomorrow to keep your streak alive.
              </Text>
            ) : (
              <Btn label="Mark today complete" onPress={complete} />
            )}
          </View>
        </View>
      )}

      {/* Day grid */}
      <Card>
        <SectionLabel>Your {journey.totalDays} days</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: journey.totalDays }).map((_, i) => {
            const d = i + 1;
            const completed = d <= p.completed_days;
            const isToday = d === p.completed_days + 1 && !doneToday && !isComplete;
            return (
              <View key={i} style={{
                width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
                backgroundColor: completed ? journey.accent : isToday ? `${journey.accent}22` : "rgba(197,166,107,0.07)",
                borderWidth: isToday ? 1.5 : 0, borderColor: journey.accent,
              }}>
                <Text style={{
                  fontFamily: fonts.sansMedium, fontSize: 12,
                  color: completed ? "#fff" : isToday ? journey.accent : colors.textMuted,
                }}>
                  {completed ? "✓" : d}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
