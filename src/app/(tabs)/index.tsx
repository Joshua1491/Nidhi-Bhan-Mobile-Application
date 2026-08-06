// ============================================================
// Today — the daily alignment screen. Panchang + day windows are
// computed on-device (astronomy-engine); the AI reading comes from
// the website's authenticated /api/app/ai route, cached per day.
// ============================================================
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { View, Text } from "react-native";
import MoodCheckIn from "../../components/MoodCheckIn";
import PracticePlayer from "../../components/PracticePlayer";
import { Body, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../components/ui";
import { aiReading } from "../../lib/api";
import { getDailyReading, timeGreeting } from "../../lib/astro/engine";
import { dayWindows, fmtClock, fmtWindow, localMidnight, panchangAt } from "../../lib/astro/timing";
import type { AIDailyReading } from "../../lib/portal/ai-types";
import { getBundle } from "../../lib/portal/bundle";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";

function StatCell({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flex: 1, minWidth: "44%" }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.textMuted }}>{k}</Text>
      <Text style={{ fontFamily: fonts.sansRegular, fontSize: 14.5, color: colors.textPrimary, marginTop: 3 }}>{v}</Text>
    </View>
  );
}

export default function Today() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const portal = useQuery({
    queryKey: ["portal", userId],
    queryFn: () => getBundle(userId),
  });

  const ai = useQuery({
    queryKey: ["ai-daily", userId, new Date().toISOString().slice(0, 10)],
    queryFn: () => aiReading<AIDailyReading>("daily"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: 1000 * 60 * 60,
  });

  const mood = useQuery({
    queryKey: ["mood", userId, new Date().toISOString().slice(0, 10)],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_logs").select("mood")
        .eq("user_id", userId).eq("log_date", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      return data?.mood ?? null;
    },
  });

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const data = portal.data!;
  const { bundle, input, profile } = data;

  const now = new Date();
  const reading = getDailyReading(input, now);
  const firstName = (profile?.full_name ?? "").trim().split(" ")[0];

  // Real panchang + windows when we know where they are (birth coords).
  const pan = panchangAt(now);
  let sunrise = "—", sunset = "—", rahu = "—", abhijit = "—";
  if (bundle.coords) {
    const { lat, lon, tz } = bundle.coords;
    const mid = localMidnight(now.getFullYear(), now.getMonth(), now.getDate(), tz);
    const dw = dayWindows(lat, lon, mid);
    if (dw.sunrise) sunrise = fmtClock(dw.sunrise, tz);
    if (dw.sunset) sunset = fmtClock(dw.sunset, tz);
    const find = (n: string) => dw.windows.find((w) => w.name === n);
    const r = find("Rahu Kaal"); if (r) rahu = fmtWindow(r, tz);
    const a = find("Abhijit Muhurta"); if (a) abhijit = fmtWindow(a, tz);
  }

  const weather = ai.data?.weatherWord ?? reading.weatherWord;
  const score = ai.data?.dayQualityScore ?? reading.auspiciousScore;
  const focus = ai.data?.focus ?? reading.focus;
  const caution = ai.data?.caution ?? reading.caution;
  const intention = ai.data?.intention ?? reading.intentionPrompt;

  return (
    <Screen
      refreshing={portal.isRefetching}
      onRefresh={() => qc.invalidateQueries({ queryKey: ["portal", userId] })}
    >
      <View>
        <Eyebrow>{reading.dateLabel}</Eyebrow>
        <Title>{timeGreeting(now)}{firstName ? `, ${firstName}` : ""}</Title>
        <Sub>{bundle.chart.birthSummary}</Sub>
      </View>

      {/* Day quality */}
      <Card tint="rgba(232,224,240,0.55)">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Eyebrow color={colors.mauve}>Today feels</Eyebrow>
            <Serif size={30}>{weather}</Serif>
            {ai.data?.dayQualityNote ? <Sub>{ai.data.dayQualityNote}</Sub> : null}
          </View>
          <View style={{ alignItems: "center" }}>
            <View style={{
              width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: colors.softGold, backgroundColor: "rgba(255,255,255,0.7)",
            }}>
              <Text style={{ fontFamily: fonts.serifSemi, fontSize: 24, color: colors.warmGold }}>{score}</Text>
            </View>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.textMuted, marginTop: 5 }}>day score</Text>
          </View>
        </View>
      </Card>

      {/* Panchang */}
      <View>
        <SectionLabel>Today's sky</SectionLabel>
        <Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, columnGap: 12 }}>
            <StatCell k="Tithi" v={`${pan.tithi} · ${pan.paksha.split(" ")[0]}`} />
            <StatCell k="Nakshatra" v={pan.nakshatra} />
            <StatCell k="Sunrise" v={sunrise} />
            <StatCell k="Sunset" v={sunset} />
            <StatCell k="Rahu Kaal (avoid)" v={rahu} />
            <StatCell k="Abhijit (favourable)" v={abhijit} />
          </View>
        </Card>
      </View>

      {/* Focus / caution */}
      <View style={{ gap: 12 }}>
        <Card tint="rgba(217,229,219,0.5)" borderColor="rgba(157,180,160,0.35)">
          <Eyebrow color="#7E9B82">Lean into</Eyebrow>
          <Body style={{ marginTop: 6 }}>{focus}</Body>
        </Card>
        <Card tint="rgba(245,221,209,0.5)" borderColor="rgba(212,160,160,0.35)">
          <Eyebrow color={colors.dustyRose}>Hold back from</Eyebrow>
          <Body style={{ marginTop: 6 }}>{caution}</Body>
        </Card>
      </View>

      {/* Practice */}
      <View>
        <SectionLabel>Your practice for today</SectionLabel>
        <PracticePlayer
          title={reading.practice.title} minutes={reading.practice.minutes}
          kind={reading.practice.kind} note={ai.data?.practiceNote ?? reading.practice.note}
          script={reading.practice.script}
        />
      </View>

      <MoodCheckIn userId={userId} initialMood={mood.data ?? null} />

      {/* Intention */}
      <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
        <Eyebrow>Set an intention</Eyebrow>
        <Serif size={21} style={{ marginTop: 8, fontFamily: "CormorantGaramond_400Regular" }}>
          {intention}
        </Serif>
      </Card>

      {/* Lucky row */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <StatCell k="Colour" v={reading.luckyColor} />
          <StatCell k="Number" v={String(reading.luckyNumber)} />
          <StatCell k="Direction" v={reading.luckyDirection} />
        </View>
      </Card>

      {/* Evening */}
      <View>
        <SectionLabel>For tonight</SectionLabel>
        <PracticePlayer
          title={reading.eveningPractice.title} minutes={reading.eveningPractice.minutes}
          kind={reading.eveningPractice.kind} note={reading.eveningPractice.note}
          script={reading.eveningPractice.script} variant="evening"
        />
      </View>
    </Screen>
  );
}
