// Explore — hub of the portal's tools, gated by feature flags.
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card, Eyebrow, Loading, Screen, Sub, Title } from "../../../components/ui";
import { getFlags } from "../../../lib/portal/actions";
import { colors, fonts } from "../../../theme";

const TOOLS = [
  { href: "/explore/chart", flag: null, title: "Your Full Chart", sub: "All nine grahas — signs, houses, nakshatras and dignities from your canonical chart.", accent: "#C4A0B9", tint: "rgba(196,160,185,0.12)" },
  { href: "/explore/book", flag: null, title: "Book a Session", sub: "Work with Dr. Nidhi directly — astrology, hypnotherapy, regression and more.", accent: "#B8935A", tint: "rgba(184,147,90,0.12)" },
  { href: "/explore/sessions", flag: null, title: "Your Sessions", sub: "What's booked, how to join, and what has already been held.", accent: "#C5A66B", tint: "rgba(197,166,107,0.10)" },
  { href: "/explore/messages", flag: null, title: "Messages", sub: "Write to Dr. Nidhi between sessions — it stays with your record.", accent: "#C4A0B9", tint: "rgba(196,160,185,0.12)" },
  { href: "/explore/insights", flag: null, title: "Your Insights", sub: "Mood trends and practice streaks from your own last 30 days.", accent: "#7E9B82", tint: "rgba(157,180,160,0.14)" },
  { href: "/explore/muhurta", flag: "muhurta_enabled", title: "Auspicious Dates", sub: "Find the right day to marry, launch, travel or sign — chosen for your chart.", accent: "#C5A66B", tint: "rgba(197,166,107,0.10)" },
  { href: "/explore/compatibility", flag: "compatibility_enabled", title: "Compatibility", sub: "Guna Milan — match two birth charts across the eight classical kootas.", accent: "#D4A0A0", tint: "rgba(212,160,160,0.12)" },
  { href: "/explore/remedies", flag: null, title: "Remedies", sub: "What Dr. Nidhi has prescribed for your chart — tracked day by day.", accent: "#7E8AA0", tint: "rgba(126,138,160,0.12)" },
  { href: "/explore/journal", flag: null, title: "Reflections", sub: "A private journal with a daily prompt — notice the patterns underneath.", accent: "#C4A0B9", tint: "rgba(196,160,185,0.12)" },
  { href: "/explore/festivals", flag: "festivals_enabled", title: "Festival & Fasting Calendar", sub: "What's coming up, what it means, and how to observe it — wherever you are.", accent: "#9DB4A0", tint: "rgba(157,180,160,0.14)" },
  { href: "/explore/notes", flag: null, title: "Dr. Nidhi's Notes", sub: "Personal notes and next steps from your sessions, kept close.", accent: "#B8935A", tint: "rgba(184,147,90,0.10)" },
] as const;

export default function Explore() {
  const flags = useQuery({ queryKey: ["flags"], queryFn: getFlags, staleTime: 5 * 60_000 });
  if (flags.isLoading) return <Screen><Loading /></Screen>;
  const map = flags.data ?? {};

  return (
    <Screen>
      <View>
        <Eyebrow>Explore</Eyebrow>
        <Title>Tools for the{"\n"}inner work</Title>
        <Sub>Everything here reads from your real chart — nothing generic.</Sub>
      </View>

      {TOOLS.filter((t) => !t.flag || map[t.flag] !== false).map((t) => (
        <Link key={t.href} href={t.href as never} asChild>
          <Pressable>
            <Card tint={t.tint} borderColor={`${t.accent}44`}>
              <Text style={{ fontFamily: fonts.serifMedium, fontSize: 22, color: colors.charcoal }}>{t.title}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary, marginTop: 4 }}>{t.sub}</Text>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: t.accent, marginTop: 10 }}>Open →</Text>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}
