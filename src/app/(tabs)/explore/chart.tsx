// Full birth chart — every graha with sign, house, nakshatra and dignity,
// read from the canonical VedAstro chart cached in birth_details.full_chart.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import type { PlanetPosition } from "../../../lib/astro/fullchart";
import { getBundle } from "../../../lib/portal/bundle";
import { useSession } from "../../../lib/session";
import { colors, fonts } from "../../../theme";

const DIGNITY_COLOR: Record<string, string> = {
  Exalted: "#7E9B82", Moolatrikona: "#7E9B82", "Own sign": "#C5A66B",
  Friend: "#9DB4A0", Neutral: "#9A90A3", Enemy: "#C4885A", Debilitated: "#B4544C",
};
const GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☾", Mars: "♂", Mercury: "☿", Jupiter: "♃",
  Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};

function PlanetRow({ p, last }: { p: PlanetPosition; last: boolean }) {
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.cardBorder }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 17, color: colors.warmGold, width: 24, textAlign: "center" }}>{GLYPHS[p.graha] ?? "•"}</Text>
          <Text style={{ fontFamily: fonts.serifMedium, fontSize: 18, color: colors.charcoal }}>{p.graha}</Text>
          {p.retrograde ? (
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, color: colors.dustyRose, letterSpacing: 1 }}>℞ RETRO</Text>
          ) : null}
          {p.combust ? (
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, color: "#C4885A", letterSpacing: 1 }}>COMBUST</Text>
          ) : null}
        </View>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: DIGNITY_COLOR[p.dignity] ?? colors.textMuted }}>
          {p.dignity}
        </Text>
      </View>
      <View style={{ flexDirection: "row", marginTop: 6, marginLeft: 34, gap: 16, flexWrap: "wrap" }}>
        <Text style={{ fontFamily: fonts.sansRegular, fontSize: 13, color: colors.textPrimary }}>
          {p.sign} {p.signDegrees.toFixed(1)}°
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>House {p.house}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>
          {p.nakshatra} · {p.nakshatraPada}
        </Text>
      </View>
    </View>
  );
}

export default function ChartScreen() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const { bundle } = portal.data!;
  const full = bundle.full;

  return (
    <Screen refreshing={portal.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["portal", userId] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Your full chart</Eyebrow>
        <Title>The sky at the{"\n"}moment you arrived</Title>
        <Sub>{bundle.chart.birthSummary}</Sub>
      </View>

      {full ? (
        <>
          <Card tint="rgba(232,224,240,0.55)">
            <SectionLabel>Ascendant · Lagna</SectionLabel>
            <Serif size={26}>{full.ascendant.sign} {full.ascendant.degrees.toFixed(1)}°</Serif>
            <Sub>The lens your whole chart is read through — houses count from here.</Sub>
          </Card>

          <View>
            <SectionLabel>The nine grahas</SectionLabel>
            <Card>
              {full.planets.map((p, i) => (
                <PlanetRow key={p.graha} p={p} last={i === full.planets.length - 1} />
              ))}
            </Card>
          </View>

          <Card>
            <SectionLabel>Reading the dignities</SectionLabel>
            <Sub style={{ marginTop: 0 }}>
              Exalted and own-sign grahas act with their full strength; debilitated or
              enemy-sign grahas ask for more patience — and often carry a remedy. Ask
              Dr. Nidhi about anything here in your next session.
            </Sub>
          </Card>
        </>
      ) : (
        <Card style={{ alignItems: "center", paddingVertical: 34 }}>
          <Text style={{ fontSize: 26 }}>🌌</Text>
          <Serif size={20} style={{ marginTop: 8 }}>Chart not built yet</Serif>
          <Sub style={{ textAlign: "center" }}>
            Add your birth details on the You tab, then pull to refresh here.
          </Sub>
        </Card>
      )}
    </Screen>
  );
}
