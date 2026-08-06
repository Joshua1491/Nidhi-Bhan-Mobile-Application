import { Redirect, Stack } from "expo-router";
import { useSession } from "../../lib/session";
import { colors } from "../../theme";

export default function AuthLayout() {
  const { session, loading, onboarded } = useSession();
  if (!loading && session && onboarded) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />;
}
