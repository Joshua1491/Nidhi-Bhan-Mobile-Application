// Auspicious Dates — real muhurta scoring computed on-device for the event location.
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Btn, Card, Chip, Eyebrow, Input, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { geocodePlace } from "../../../lib/api";
import { MUHURTA_ACTIVITIES } from "../../../lib/astro/engine";
import { getAuspiciousDatesReal } from "../../../lib/astro/muhurta";
import { getBundle } from "../../../lib/portal/bundle";
import { useSession } from "../../../lib/session";
import { colors, fonts } from "../../../theme";

const TIER_COLORS: Record<string, string> = {
  best: "#7E9B82", good: "#C5A66B", neutral: "#9A90A3", avoid: "#B4544C",
};
const DEFAULT = { lat: 19.076, lon: 72.877, tz: 5.5, label: "Mumbai, India" };

export default function Muhurta() {
  const { session } = useSession();
  const userId = session!.user.id;
  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });

  const now = new Date();
  const [activity, setActivity] = useState(MUHURTA_ACTIVITIES[0].id as string);
  const [monthOffset, setMonthOffset] = useState(0);
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number; tz: number; label: string } | null>(null);
  const [locBusy, setLocBusy] = useState(false);

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const birth = portal.data!.birth;

  const eff =
    coords ??
    (birth?.latitude != null && birth?.longitude != null
      ? { lat: birth.latitude, lon: birth.longitude, tz: Number(birth.tz_offset ?? 5.5), label: portal.data!.input.birth_place ?? DEFAULT.label }
      : DEFAULT);

  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const result = getAuspiciousDatesReal(activity, target.getFullYear(), target.getMonth(), eff.lat, eff.lon, eff.tz, eff.label);
  const act = MUHURTA_ACTIVITIES.find((a) => a.id === activity) ?? MUHURTA_ACTIVITIES[0];

  async function setLocation() {
    if (!city.trim()) return;
    setLocBusy(true);
    const g = await geocodePlace(city.trim());
    setLocBusy(false);
    if (g) setCoords({ lat: g.lat, lon: g.lon, tz: g.tz, label: city.trim() });
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Auspicious dates</Eyebrow>
        <Title>Choose the day{"\n"}the sky agrees with</Title>
        <Sub>{act.note}</Sub>
      </View>

      <View>
        <SectionLabel>What are you planning?</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {MUHURTA_ACTIVITIES.map((a) => (
            <Chip key={a.id} label={a.label} active={a.id === activity} onPress={() => setActivity(a.id)} />
          ))}
        </View>
      </View>

      <Card>
        <SectionLabel>Event location</SectionLabel>
        <Text style={{ fontFamily: fonts.sansRegular, fontSize: 14, color: colors.textPrimary }}>{eff.label}</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Change city…" value={city} onChangeText={setCity} />
          </View>
          <View style={{ width: 92 }}>
            <Btn label="Set" kind="ghost" onPress={setLocation} loading={locBusy} />
          </View>
        </View>
      </Card>

      {/* Month switcher */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => setMonthOffset(monthOffset - 1)} disabled={monthOffset <= 0}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: monthOffset <= 0 ? colors.textMuted : colors.warmGold, padding: 8 }}>←</Text>
        </Pressable>
        <Serif size={22}>{result.monthLabel}</Serif>
        <Pressable onPress={() => setMonthOffset(monthOffset + 1)} disabled={monthOffset >= 11}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: monthOffset >= 11 ? colors.textMuted : colors.warmGold, padding: 8 }}>→</Text>
        </Pressable>
      </View>

      {/* Best picks */}
      {result.bestPicks.length ? (
        <View>
          <SectionLabel>Best days</SectionLabel>
          <View style={{ gap: 12 }}>
            {result.bestPicks.map((d) => (
              <Card key={d.iso} tint="rgba(157,180,160,0.12)" borderColor="rgba(126,155,130,0.4)">
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Serif size={20}>{d.weekday} {d.dateNum}</Serif>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: TIER_COLORS.best }}>score {d.score}</Text>
                </View>
                <Sub>{d.note}</Sub>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 6 }}>
                  Best window: {d.bestWindow}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* Calendar grid */}
      <Card>
        <SectionLabel>Whole month</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {result.days.map((d) => (
            <View key={d.iso} style={{
              width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center",
              backgroundColor: `${TIER_COLORS[d.tier]}${d.tier === "neutral" ? "14" : "22"}`,
              borderWidth: 1, borderColor: `${TIER_COLORS[d.tier]}55`,
            }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: TIER_COLORS[d.tier] }}>{d.dateNum}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {(["best", "good", "neutral", "avoid"] as const).map((t) => (
            <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TIER_COLORS[t] }} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
