import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";
import { Btn, ErrorText, Eyebrow, Input, Screen, Title, Sub } from "../../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setError(null);
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ paddingTop: 40 }}>
          <Eyebrow>Dr. Nidhi Bhan</Eyebrow>
          <Title>Welcome back{"\n"}to your practice</Title>
          <Sub>Sign in to return to your chart, journeys and reflections.</Sub>
        </View>
        <View style={{ gap: 14, marginTop: 10 }}>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          <ErrorText>{error}</ErrorText>
          <Btn label="Sign in" onPress={signIn} loading={busy} />
          <Link href="/signup" style={{ textAlign: "center", marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
              New here? <Text style={{ fontFamily: fonts.sansMedium, color: colors.warmGold }}>Create an account</Text>
            </Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
