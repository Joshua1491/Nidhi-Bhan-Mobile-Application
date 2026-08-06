// Remedies — recommended for the current dasha/Sade Sati; tracked with streaks.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Btn, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import { getRecommendedRemediesByPeriod, getRemedy, REMEDIES } from "../../../lib/content/remedies";
import { addRemedy, completeRemedyToday, removeRemedy } from "../../../lib/portal/actions";
import type { AIRemediesReading } from "../../../lib/portal/ai-types";
import { getBundle } from "../../../lib/portal/bundle";
import type { RemedyProgress } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function Remedies() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const plan = useQuery({
    queryKey: ["remedies", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("remedy_progress")
        .select("remedy_slug, streak, total_done, last_done_date, status")
        .eq("user_id", userId);
      return (data ?? []) as RemedyProgress[];
    },
  });
  const ai = useQuery({
    queryKey: ["ai-remedies", userId, portal.data?.bundle.dasha.mahaLord],
    queryFn: () => aiReading<AIRemediesReading>("remedies"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: Infinity,
  });

  if (portal.isLoading || plan.isLoading) return <Screen><Loading /></Screen>;
  const { dasha, sade } = portal.data!.bundle;
  const recommended = getRecommendedRemediesByPeriod(dasha.mahaLord, sade.active);
  const mine = plan.data ?? [];
  const mineSlugs = new Set(mine.map((r) => r.remedy_slug));
  const today = new Date().toISOString().slice(0, 10);

  const refresh = () => qc.invalidateQueries({ queryKey: ["remedies", userId] });

  return (
    <Screen refreshing={plan.isRefetching} onRefresh={refresh}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Remedies · Upayas</Eyebrow>
        <Title>Small acts,{"\n"}steady shifts</Title>
        <Sub>Tuned to your {dasha.mahaLord} period{sade.active ? " and active Sade Sati" : ""}.</Sub>
      </View>

      {ai.data ? (
        <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
          <Eyebrow>Why these, now</Eyebrow>
          <Body style={{ marginTop: 8 }}>{ai.data.intro}</Body>
          {ai.data.priority ? <Body style={{ marginTop: 8, fontFamily: fonts.sansMedium }}>{ai.data.priority}</Body> : null}
        </Card>
      ) : null}

      {/* My plan */}
      {mine.length > 0 ? (
        <View>
          <SectionLabel>Your plan</SectionLabel>
          <View style={{ gap: 12 }}>
            {mine.map((r) => {
              const rem = getRemedy(r.remedy_slug);
              if (!rem) return null;
              const done = r.last_done_date === today;
              return (
                <Card key={r.remedy_slug}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: rem.accent }}>
                      {rem.category} · {rem.cadence}
                    </Text>
                    {r.streak > 1 ? (
                      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: rem.accent }}>{r.streak}-day streak</Text>
                    ) : null}
                  </View>
                  <Serif size={20} style={{ marginTop: 6 }}>{rem.title}</Serif>
                  <Sub>{rem.instruction}</Sub>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <View style={{ flex: 1 }}>
                      {done ? (
                        <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: rem.accent, textAlign: "center", paddingVertical: 13 }}>
                          ✓ Done today
                        </Text>
                      ) : (
                        <Btn label="Done today" onPress={async () => { await completeRemedyToday(userId, r.remedy_slug); refresh(); }} />
                      )}
                    </View>
                    <View style={{ width: 110 }}>
                      <Btn label="Remove" kind="ghost" onPress={async () => { await removeRemedy(userId, r.remedy_slug); refresh(); }} />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Recommended */}
      <View>
        <SectionLabel>Recommended for this period</SectionLabel>
        <View style={{ gap: 12 }}>
          {recommended.filter((r) => !mineSlugs.has(r.slug)).map((rem) => (
            <Card key={rem.slug}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: rem.accent }}>
                {rem.category} · pacifies {rem.planet} · {rem.cadence}
              </Text>
              <Serif size={20} style={{ marginTop: 6 }}>{rem.title}</Serif>
              <Sub>{rem.short}</Sub>
              {rem.premium ? (
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.warmGold, marginTop: 10 }}>
                  Requires a consult with Dr. Nidhi before beginning.
                </Text>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Btn label="Add to my plan" kind="ghost" onPress={async () => { await addRemedy(userId, rem.slug); refresh(); }} />
                </View>
              )}
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
