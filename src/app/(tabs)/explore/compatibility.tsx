// Compatibility — Guna Milan between your chart and another; computed server-side.
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Body, Btn, Card, ErrorText, Eyebrow, Input, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import type { CompatResult } from "../../../lib/portal/ai-types";
import { colors, fonts } from "../../../theme";

const TONE_COLOR: Record<string, string> = {
  excellent: "#7E9B82", good: "#C5A66B", fair: "#C4A0B9", challenging: "#B4544C",
};

export default function Compatibility() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatResult | null>(null);

  async function run() {
    setError(null); setResult(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || !place.trim()) {
      setError("Enter the other person's birth date (YYYY-MM-DD) and place."); return;
    }
    setBusy(true);
    const res = await aiReading<{ result?: CompatResult; error?: string }>("compat", {
      partner: {
        full_name: name.trim() || null,
        birth_date: date.trim(),
        birth_time: time.trim() || null,
        birth_place: place.trim(),
      },
    });
    setBusy(false);
    if (!res || res.error || !res.result) {
      setError(res?.error ?? "The compatibility service is busy right now — please try again in a moment.");
      return;
    }
    setResult(res.result);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
        </Pressable>
        <View>
          <Eyebrow>Compatibility · Guna Milan</Eyebrow>
          <Title>Two charts,{"\n"}one conversation</Title>
          <Sub>Matched across the eight classical kootas, using your saved birth details.</Sub>
        </View>

        <Card>
          <SectionLabel>The other person</SectionLabel>
          <View style={{ gap: 12 }}>
            <Input label="Name (optional)" value={name} onChangeText={setName} />
            <Input label="Birth date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="1992-11-04" autoCapitalize="none" />
            <Input label="Birth time — 24h (optional)" value={time} onChangeText={setTime} placeholder="09:15" autoCapitalize="none" />
            <Input label="Birth place" value={place} onChangeText={setPlace} placeholder="Delhi, India" />
            <ErrorText>{error}</ErrorText>
            <Btn label="Check compatibility" onPress={run} loading={busy} color={colors.dustyRose} />
          </View>
        </Card>

        {result ? (
          <>
            <Card tint={`${TONE_COLOR[result.tone]}14`} borderColor={`${TONE_COLOR[result.tone]}55`} style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.serifLight, fontSize: 52, color: TONE_COLOR[result.tone] }}>
                {result.scorePercent}%
              </Text>
              <Serif size={21}>{result.verdict}</Serif>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, marginTop: 6 }}>
                {result.nakA} · {result.nakB}
              </Text>
            </Card>

            {result.summary ? (
              <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
                <Eyebrow>Dr. Nidhi's read</Eyebrow>
                <Body style={{ marginTop: 8 }}>{result.summary}</Body>
              </Card>
            ) : null}

            <View>
              <SectionLabel>The eight kootas</SectionLabel>
              <Card>
                {result.factors.map((f, i) => (
                  <View key={f.name} style={{ paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.cardBorder }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary }}>{f.name}</Text>
                      <Text style={{
                        fontFamily: fonts.sansMedium, fontSize: 12,
                        color: f.nature.toLowerCase() === "good" ? "#7E9B82" : f.nature.toLowerCase() === "bad" ? "#B4544C" : colors.textMuted,
                      }}>
                        {f.nature}
                      </Text>
                    </View>
                    {f.info ? (
                      <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 3 }}>
                        {f.info}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
