// Horizon — where you are in the bigger story: dasha chapter, Sade Sati, AI insight.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { Body, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../components/ui";
import { aiReading } from "../../lib/api";
import { vimshottariMahaTimeline } from "../../lib/astro/engine";
import type { AIHorizonReading } from "../../lib/portal/ai-types";
import { getBundle } from "../../lib/portal/bundle";
import { useSession } from "../../lib/session";
import { colors, fonts } from "../../theme";

const PHASES: { key: "rising" | "peak" | "setting"; label: string; blurb: string }[] = [
  { key: "rising", label: "Rising", blurb: "Saturn approaches your Moon — pressures build slowly." },
  { key: "peak", label: "Peak", blurb: "Saturn crosses your Moon — the deepest forging." },
  { key: "setting", label: "Setting", blurb: "Saturn moves past — integration and release." },
];

export default function Horizon() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const ai = useQuery({
    queryKey: ["ai-horizon", userId],
    queryFn: () => aiReading<AIHorizonReading>("horizon"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: 1000 * 60 * 60 * 6,
  });

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const { bundle, birth } = portal.data!;
  const { chart, dasha, sade } = bundle;
  const phaseIndex = PHASES.findIndex((p) => p.key === sade.phase);

  // Full Vimshottari ladder — needs the canonical chart + birth instant.
  let timeline: ReturnType<typeof vimshottariMahaTimeline> = [];
  if (bundle.full && birth?.birth_date) {
    const tz = Number(birth.tz_offset ?? 0);
    const sign = tz < 0 ? "-" : "+";
    const a = Math.abs(tz);
    const hh = String(Math.floor(a)).padStart(2, "0");
    const mm = String(Math.round((a - Math.floor(a)) * 60)).padStart(2, "0");
    const time = birth.birth_time && birth.birth_time.length >= 4 ? birth.birth_time.slice(0, 5) : "12:00";
    const born = new Date(`${birth.birth_date}T${time}:00${sign}${hh}:${mm}`);
    if (!isNaN(born.getTime())) timeline = vimshottariMahaTimeline(bundle.full.moonLongitude, born);
  }

  return (
    <Screen refreshing={portal.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["portal", userId] })}>
      <View>
        <Eyebrow>Your horizon</Eyebrow>
        <Title>Where you are{"\n"}in the bigger story</Title>
      </View>

      {/* Chart essentials */}
      <Card>
        <SectionLabel>Your chart</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 14 }}>
          {[
            ["Moon sign", chart.moonSign],
            ["Sun sign", chart.sunSign],
            ["Ascendant", chart.ascendant],
            ["Nakshatra", `${chart.nakshatra} · Pada ${chart.nakshatraPada}`],
          ].map(([k, v]) => (
            <View key={k} style={{ width: "50%" }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.textMuted }}>{k}</Text>
              <Text style={{ fontFamily: fonts.serifMedium, fontSize: 18, color: colors.charcoal, marginTop: 3 }}>{v}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Dasha chapter */}
      <Card tint="rgba(232,224,240,0.55)">
        <Eyebrow color={colors.mauve}>Current chapter · Mahadasha</Eyebrow>
        <Serif size={28} style={{ marginTop: 6 }}>{dasha.mahaLord} period</Serif>
        {dasha.mahaTheme ? <Sub>{dasha.mahaTheme}</Sub> : null}
        <View style={{ marginTop: 16 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.8)", overflow: "hidden" }}>
            <View style={{ width: `${Math.max(2, Math.min(100, dasha.progressPct))}%`, height: 6, backgroundColor: colors.softGold }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted }}>
              {Math.round(dasha.progressPct)}% through
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted }}>
              ends {dasha.mahaEndLabel}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.textMuted }}>Antardasha</Text>
            <Text style={{ fontFamily: fonts.sansRegular, fontSize: 14.5, color: colors.textPrimary, marginTop: 3 }}>
              {dasha.antarLord} · until {dasha.antarEndLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.textMuted }}>Next chapter</Text>
            <Text style={{ fontFamily: fonts.sansRegular, fontSize: 14.5, color: colors.textPrimary, marginTop: 3 }}>{dasha.nextLord}</Text>
          </View>
        </View>
      </Card>

      {/* AI insight */}
      {ai.data ? (
        <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
          <Eyebrow>Dr. Nidhi on this season</Eyebrow>
          <Body style={{ marginTop: 8 }}>{ai.data.dashaInsight}</Body>
          {ai.data.guidance ? (
            <Serif size={19} style={{ marginTop: 12, fontFamily: "CormorantGaramond_400Regular" }}>
              “{ai.data.guidance}”
            </Serif>
          ) : null}
        </Card>
      ) : null}

      {/* Life timeline */}
      {timeline.length ? (
        <View>
          <SectionLabel>Your life in chapters · Vimshottari</SectionLabel>
          <Card>
            {timeline.map((m, i) => (
              <View key={`${m.lord}-${m.startYear}`} style={{
                flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.cardBorder,
                opacity: m.isPast ? 0.55 : 1,
              }}>
                <View style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: m.isCurrent ? colors.softGold : m.isPast ? colors.textMuted : colors.lavender,
                  borderWidth: m.isCurrent ? 2 : 0, borderColor: colors.warmGold,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: m.isCurrent ? fonts.sansMedium : fonts.sansRegular,
                    fontSize: 14, color: m.isCurrent ? colors.warmGold : colors.textPrimary,
                  }}>
                    {m.lord}{m.isCurrent ? " — you are here" : ""}
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted, marginTop: 1 }}>
                    {m.theme}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
                  {m.startLabel} – {m.endLabel}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {/* Sade Sati */}
      <View>
        <SectionLabel>Sade Sati</SectionLabel>
        <Card>
          <Serif size={22}>{sade.active ? sade.phaseLabel : "Not active"}</Serif>
          <Sub>{ai.data?.sadeSatiInsight ?? sade.message}</Sub>
          {sade.active ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              {PHASES.map((p, i) => (
                <View key={p.key} style={{
                  flex: 1, padding: 10, borderRadius: 14,
                  backgroundColor: i === phaseIndex ? "rgba(197,166,107,0.14)" : "rgba(255,255,255,0.6)",
                  borderWidth: 1, borderColor: i === phaseIndex ? colors.softGold : colors.cardBorder,
                }}>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: i === phaseIndex ? colors.warmGold : colors.textMuted }}>{p.label}</Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11, lineHeight: 15, color: colors.textSecondary, marginTop: 4 }}>{p.blurb}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {sade.active && sade.turnLabel ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, marginTop: 12 }}>
              This phase eases around {sade.turnLabel} · ~{sade.monthsRemaining} months remaining
            </Text>
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}
