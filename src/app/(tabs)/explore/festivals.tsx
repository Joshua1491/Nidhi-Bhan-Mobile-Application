// Festival & fasting calendar with a personalized note.
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import { RECURRING_FASTS, upcomingObservances } from "../../../lib/content/festivals";
import { getBundle } from "../../../lib/portal/bundle";
import { useSession } from "../../../lib/session";
import { colors, fonts } from "../../../theme";

export default function Festivals() {
  const { session } = useSession();
  const userId = session!.user.id;
  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const ai = useQuery({
    queryKey: ["ai-festivals", userId, new Date().toISOString().slice(0, 7)],
    queryFn: () => aiReading<{ note: string }>("festival-note"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: Infinity,
  });

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const now = new Date();
  const todayMs = Date.parse(now.toISOString().slice(0, 10));
  const items = upcomingObservances(now).map((o) => ({
    ...o,
    daysUntil: Math.round((Date.parse(o.date) - todayMs) / 86400000),
    dateLabel: new Date(o.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }),
  }));

  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Festivals & fasts</Eyebrow>
        <Title>Days that carry{"\n"}more than others</Title>
        <Sub>Lunar dates can shift slightly by region — confirm locally for observances that matter to you.</Sub>
      </View>

      {ai.data?.note ? (
        <Card tint="rgba(157,180,160,0.12)" borderColor="rgba(157,180,160,0.4)">
          <Eyebrow color="#7E9B82">For your chart this month</Eyebrow>
          <Body style={{ marginTop: 8 }}>{ai.data.note}</Body>
        </Card>
      ) : null}

      <View>
        <SectionLabel>Coming up</SectionLabel>
        <View style={{ gap: 12 }}>
          {items.map((o) => (
            <Card key={`${o.date}-${o.name}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: o.accent }}>
                  {o.type === "fast" ? "Fast" : "Festival"} · {o.dateLabel}
                </Text>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.textMuted }}>
                  {o.daysUntil === 0 ? "Today" : o.daysUntil === 1 ? "Tomorrow" : `in ${o.daysUntil} days`}
                </Text>
              </View>
              <Serif size={21} style={{ marginTop: 6 }}>{o.name}</Serif>
              <Sub>{o.significance}</Sub>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.textPrimary, marginTop: 8 }}>
                <Text style={{ fontFamily: fonts.sansMedium }}>To observe: </Text>{o.observe}
              </Text>
            </Card>
          ))}
        </View>
      </View>

      <View>
        <SectionLabel>Recurring fasts</SectionLabel>
        <Card>
          {RECURRING_FASTS.map((f, i) => (
            <View key={f.name} style={{ paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.cardBorder }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14.5, color: colors.textPrimary }}>{f.name}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 2 }}>
                {f.cadence} — {f.note}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
