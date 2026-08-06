import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { getFlags } from "../../lib/portal/actions";
import { colors, fonts } from "../../theme";
import { Btn, ErrorText, Eyebrow, Input, Screen, Title, Sub } from "../../components/ui";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setError(null);
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) { setError("Please tell us your name."); return; }
    if (!mail || !password) { setError("Please enter your email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setBusy(true);
    try {
      const { data: blocked } = await supabase.rpc("is_blocked", { p_email: mail });
      if (blocked) { setError("This email address can't be used to create an account."); return; }

      const flags = await getFlags();
      if (flags["signups_enabled"] === false) {
        setError("New sign-ups are paused right now. Please check back soon."); return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: mail, password, options: { data: { full_name: name } },
      });

      if (error) {
        const exists = /already registered|already exists|already been registered/i.test(error.message);
        setError(exists ? "An account with this email already exists. Please sign in instead." : error.message);
        return;
      }
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setError("An account with this email already exists. Please sign in instead."); return;
      }
      if (!data.session) { router.push({ pathname: "/verify", params: { email: mail } }); return; }
      router.replace("/onboarding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ paddingTop: 40 }}>
          <Eyebrow>Begin</Eyebrow>
          <Title>Create your{"\n"}private space</Title>
          <Sub>Your chart, daily alignment and reflections — kept gently in one place.</Sub>
        </View>
        <View style={{ gap: 14, marginTop: 10 }}>
          <Input label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
          <ErrorText>{error}</ErrorText>
          <Btn label="Create account" onPress={signUp} loading={busy} />
          <Link href="/login" style={{ textAlign: "center", marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
              Already have an account? <Text style={{ fontFamily: fonts.sansMedium, color: colors.warmGold }}>Sign in</Text>
            </Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
