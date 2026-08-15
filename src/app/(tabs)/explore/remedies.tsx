// Remedies — what has been PRESCRIBED, not a catalogue to shop from.
//
// This screen used to list the whole remedy library with "Add to my
// plan" buttons: anyone with a login could put themselves on a Saturn
// fast because the card looked appealing, and Dr. Nidhi would never
// know. The portal removed that model; the app now matches it. What
// shows here is what she prescribed (in her name, with her reason),
// what was drawn from the chart, and — fading out over time — whatever
// the client had added themselves before prescriptions existed. The
// period recommendations remain, but as things to DISCUSS, not to add.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Btn, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import { getRecommendedRemediesByPeriod, getRemedy } from "../../../lib/content/remedies";
import { completeRemedyToday, removeRemedy } from "../../../lib/portal/actions";
import type { AIRemediesReading } from "../../../lib/portal/ai-types";
import { getBundle } from "../../../lib/portal/bundle";
import type { PrescribedRemedy } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

const SOURCE_LABEL: Record<PrescribedRemedy["source"], string> = {
  practitioner: "From Dr. Nidhi",
  ai: "From your chart",
  self: "Added by you",
};

export default function Remedies() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const plan = useQuery({
    queryKey: ["remedies", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("my_remedies");
      return ((data ?? []) as PrescribedRemedy[]).filter((r) => getRemedy(r.remedy_slug));
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
  const mine = plan.data ?? [];
  const mineSlugs = new Set(mine.map((r) => r.remedy_slug));
  const recommended = getRecommendedRemediesByPeriod(dasha.mahaLord, sade.active)
    .filter((r) => !mineSlugs.has(r.slug));
  const today = new Date().toISOString().slice(0, 10);

  const refresh = () => qc.invalidateQueries({ queryKey: ["remedies", userId] });

  const bySource = (source: PrescribedRemedy["source"]) =>
    mine.filter((r) => r.source === source);

  const renderPrescribed = (r: PrescribedRemedy) => {
    const rem = getRemedy(r.remedy_slug)!;
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
        {r.reason ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 8, fontStyle: "italic" }}>
            &ldquo;{r.reason}&rdquo;
          </Text>
        ) : null}
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
          {r.source === "self" ? (
            <View style={{ width: 110 }}>
              <Btn label="Let go" kind="ghost" onPress={async () => { await removeRemedy(userId, r.remedy_slug); refresh(); }} />
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen refreshing={plan.isRefetching} onRefresh={refresh}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Remedies · Upayas</Eyebrow>
        <Title>Small acts,{"\n"}steady shifts</Title>
        <Sub>
          Chosen for your chart{sade.active ? " and active Sade Sati" : ""} — consistency
          matters far more than intensity.
        </Sub>
      </View>

      {ai.data ? (
        <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
          <Eyebrow>Why these, now</Eyebrow>
          <Body style={{ marginTop: 8 }}>{ai.data.intro}</Body>
          {ai.data.priority ? <Body style={{ marginTop: 8, fontFamily: fonts.sansMedium }}>{ai.data.priority}</Body> : null}
        </Card>
      ) : null}

      {mine.length === 0 ? (
        <Card>
          <Serif size={20}>Nothing prescribed yet</Serif>
          <Sub>
            Remedies are chosen for your chart rather than picked from a list —
            they arrive once your birth details are in, or after your first
            reading with Dr. Nidhi.
          </Sub>
          <View style={{ marginTop: 12 }}>
            <Btn label="Book a reading" kind="ghost" onPress={() => router.push("/explore/book")} />
          </View>
        </Card>
      ) : (
        (["practitioner", "ai", "self"] as const).map((source) => {
          const rows = bySource(source);
          if (rows.length === 0) return null;
          return (
            <View key={source}>
              <SectionLabel>{SOURCE_LABEL[source]}</SectionLabel>
              <View style={{ gap: 12 }}>{rows.map(renderPrescribed)}</View>
            </View>
          );
        })
      )}

      {/* Period guidance — to read and to raise with her, never to
          self-prescribe. There is no Add button on purpose. */}
      {recommended.length > 0 ? (
        <View>
          <SectionLabel>Often given in a {dasha.mahaLord} period</SectionLabel>
          <View style={{ gap: 12 }}>
            {recommended.map((rem) => (
              <Card key={rem.slug}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: rem.accent }}>
                  {rem.category} · pacifies {rem.planet} · {rem.cadence}
                </Text>
                <Serif size={20} style={{ marginTop: 6 }}>{rem.title}</Serif>
                <Sub>{rem.short}</Sub>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.warmGold, marginTop: 10 }}>
                  If this speaks to you, raise it in your next session — remedies
                  here begin with Dr. Nidhi.
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
