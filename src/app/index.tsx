import { Redirect } from "expo-router";
import { Loading } from "../components/ui";
import { useSession } from "../lib/session";

export default function Index() {
  const { session, loading, onboarded } = useSession();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (onboarded === false) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
