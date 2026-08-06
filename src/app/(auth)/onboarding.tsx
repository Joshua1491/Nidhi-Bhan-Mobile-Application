import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { updateBirthDetails, markOnboarded } from "../../lib/portal/actions";
import { useSession } from "../../lib/session";
import { Btn, ErrorText, Eyebrow, Input, Screen, Sub, Title } from "../../components/ui";

export default function Onboarding() {
  const { session, refreshOnboarded } = useSession();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    if (!session) { router.replace("/login"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
      setError("Your birth date is needed to build your chart (YYYY-MM-DD)."); return;
    }
    if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime.trim())) {
      setError("Birth time should look like 14:30 (24-hour)."); return;
    }
    setBusy(true);
    const res = await updateBirthDetails(session.user.id, {
      birth_date: birthDate.trim(),
      birth_time: birthTime.trim() || null,
      birth_place: birthPlace.trim() || null,
      gender: gender.trim() || null,
    });
    if (res.error) { setBusy(false); setError(res.error); return; }
    const res2 = await markOnboarded(session.user.id);
    setBusy(false);
    if (res2.error) { setError(res2.error); return; }
    await refreshOnboarded();
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ paddingTop: 40 }}>
          <Eyebrow>Your chart begins here</Eyebrow>
          <Title>Tell us about{"\n"}the moment you arrived</Title>
          <Sub>
            Your birth details anchor everything — your chart, dasha timeline, daily
            alignment and remedies. Time and place make it precise.
          </Sub>
        </View>
        <View style={{ gap: 14, marginTop: 10 }}>
          <Input label="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholder="1990-03-21" autoCapitalize="none" />
          <Input label="Birth time — 24h (optional)" value={birthTime} onChangeText={setBirthTime} placeholder="14:30" autoCapitalize="none" />
          <Input label="Birth place (optional)" value={birthPlace} onChangeText={setBirthPlace} placeholder="Mumbai, India" />
          <Input label="Gender (optional)" value={gender} onChangeText={setGender} placeholder="female / male / other" autoCapitalize="none" />
          <ErrorText>{error}</ErrorText>
          <Btn label="Build my chart" onPress={save} loading={busy} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
