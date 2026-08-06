import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSession } from "../../lib/session";
import { colors, fonts } from "../../theme";
import { Loading } from "../../components/ui";

function Icon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { session, loading, onboarded } = useSession();

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (onboarded === false) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.warmGold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 10.5 },
        tabBarStyle: {
          backgroundColor: "rgba(251,248,244,0.96)",
          borderTopColor: colors.cardBorder,
        },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ focused }) => <Icon glyph="☀️" focused={focused} /> }} />
      <Tabs.Screen name="horizon" options={{ title: "Horizon", tabBarIcon: ({ focused }) => <Icon glyph="🌙" focused={focused} /> }} />
      <Tabs.Screen name="journeys" options={{ title: "Journeys", tabBarIcon: ({ focused }) => <Icon glyph="🛤" focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ focused }) => <Icon glyph="✨" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: ({ focused }) => <Icon glyph="🪷" focused={focused} /> }} />
    </Tabs>
  );
}
