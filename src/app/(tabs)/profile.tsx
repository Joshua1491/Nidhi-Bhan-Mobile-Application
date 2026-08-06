// You — profile, birth details (editing re-geocodes + recomputes the chart), sign out.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Btn, Card, ErrorText, Eyebrow, Input, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../components/ui";
import { aiReading, deleteAccount } from "../../lib/api";
import { updateBirthDetails } from "../../lib/portal/actions";
import { getBundle } from "../../lib/portal/bundle";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";

export default function Profile() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const insight = useQuery({
    queryKey: ["ai-chart-insight", userId],
    queryFn: () => aiReading<{ insight: string }>("chart-insight"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: Infinity,
  });

  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (portal.isLoading) return <Screen><Loading /></Screen>;
  const { profile, birth, bundle } = portal.data!;
  const chart = bundle.chart;

  function beginEdit() {
    setDate(birth?.birth_date ?? "");
    setTime(birth?.birth_time?.slice(0, 5) ?? "");
    setPlace(birth?.birth_place ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    setError(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) { setError("Birth date must look like 1990-03-21."); return; }
    setBusy(true);
    const res = await updateBirthDetails(userId, {
      birth_date: date.trim(),
      birth_time: time.trim() || null,
      birth_place: place.trim() || null,
    });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    setEditing(false);
    qc.invalidateQueries(); // chart, readings and caches all shift with new details
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen refreshing={portal.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["portal", userId] })}>
        <View>
          <Eyebrow>You</Eyebrow>
          <Title>{profile?.full_name ?? "Your space"}</Title>
          <Sub>{session?.user.email}</Sub>
        </View>

        {/* Chart snapshot */}
        <Card tint="rgba(232,224,240,0.55)">
          <SectionLabel>Your chart</SectionLabel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 14 }}>
            {[
              ["Moon", chart.moonSign],
              ["Sun", chart.sunSign],
              ["Ascendant", chart.ascendant],
              ["Nakshatra", `${chart.nakshatra} · ${chart.nakshatraPada}`],
            ].map(([k, v]) => (
              <View key={k} style={{ width: "50%" }}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: colors.textMuted }}>{k}</Text>
                <Text style={{ fontFamily: fonts.serifMedium, fontSize: 17, color: colors.charcoal, marginTop: 3 }}>{v}</Text>
              </View>
            ))}
          </View>
          {insight.data?.insight ? (
            <Text style={{ fontFamily: fonts.serif, fontSize: 16, fontStyle: "italic", lineHeight: 23, color: colors.textSecondary, marginTop: 14 }}>
              {insight.data.insight}
            </Text>
          ) : null}
        </Card>

        {/* Birth details */}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel>Birth details</SectionLabel>
            {!editing ? (
              <Text onPress={beginEdit} style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.warmGold, marginBottom: 10 }}>
                Edit
              </Text>
            ) : null}
          </View>
          {editing ? (
            <View style={{ gap: 12 }}>
              <Input label="Birth date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />
              <Input label="Birth time — 24h" value={time} onChangeText={setTime} placeholder="14:30" autoCapitalize="none" />
              <Input label="Birth place" value={place} onChangeText={setPlace} />
              <ErrorText>{error}</ErrorText>
              <Sub style={{ marginTop: 0 }}>
                Changing these rebuilds your chart, dasha timeline and daily readings.
              </Sub>
              <Btn label="Save & rebuild chart" onPress={save} loading={busy} />
              <Btn label="Cancel" kind="ghost" onPress={() => setEditing(false)} />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {[
                ["Date", birth?.birth_date ?? "—"],
                ["Time", birth?.birth_time?.slice(0, 5) ?? "—"],
                ["Place", birth?.birth_place ?? "—"],
              ].map(([k, v]) => (
                <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>{k}</Text>
                  <Text style={{ fontFamily: fonts.sansRegular, fontSize: 14, color: colors.textPrimary }}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Btn label="Sign out" kind="ghost" onPress={() => supabase.auth.signOut()} />

        <Text
          onPress={() =>
            Alert.alert(
              "Delete your account?",
              "This permanently erases your account, chart, journal, moods and progress. It cannot be undone.",
              [
                { text: "Keep my account", style: "cancel" },
                {
                  text: "Delete everything",
                  style: "destructive",
                  onPress: async () => {
                    const res = await deleteAccount();
                    if (res?.ok) {
                      await supabase.auth.signOut();
                    } else {
                      Alert.alert(
                        "Couldn't delete the account",
                        res?.error ?? "Please check your connection and try again."
                      );
                    }
                  },
                },
              ]
            )
          }
          style={{
            fontFamily: fonts.sans, fontSize: 13, color: "#B4544C",
            textAlign: "center", paddingVertical: 6,
          }}
        >
          Delete my account and all data
        </Text>

        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
          Your data is protected and visible only to you and Dr. Nidhi.
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
