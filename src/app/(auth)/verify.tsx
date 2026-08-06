import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";
import { Btn, ErrorText, Eyebrow, Input, Screen, Title, Sub } from "../../components/ui";

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function verify() {
    setError(null);
    if (!email || token.trim().length < 6) { setError("Please enter the full code from your email."); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: token.trim(), type: "signup" });
    setBusy(false);
    if (error) { setError("That code didn't work. Please check it and try again."); return; }
    router.replace("/onboarding");
  }

  async function resend() {
    if (!email) return;
    await supabase.auth.resend({ type: "signup", email });
    setResent(true);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ paddingTop: 40 }}>
          <Eyebrow>One more step</Eyebrow>
          <Title>Check your inbox</Title>
          <Sub>We emailed a verification code to {email}. Enter it below to confirm your account.</Sub>
        </View>
        <View style={{ gap: 14, marginTop: 10 }}>
          <Input
            label="Verification code" value={token} onChangeText={setToken}
            keyboardType="number-pad" maxLength={10} autoComplete="one-time-code"
            style={{ letterSpacing: 5, fontSize: 20, textAlign: "center" }}
          />
          <ErrorText>{error}</ErrorText>
          <Btn label="Confirm" onPress={verify} loading={busy} />
          <Pressable onPress={resend} style={{ alignItems: "center", marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
              {resent ? "Code sent again — give it a minute." : "Didn't get it? Send a new code"}
            </Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
