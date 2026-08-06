// Book a session — services from the website, booked via WhatsApp or the site.
import { router } from "expo-router";
import { Linking, Pressable, Text, View } from "react-native";
import { Btn, Card, Eyebrow, Screen, Serif, Sub, Title } from "../../../components/ui";
import { SITE_URL } from "../../../lib/api";
import { colors, fonts } from "../../../theme";

const WHATSAPP = "19052675523";

const SERVICES = [
  { title: "Birth Chart Intelligence", subtitle: "Vedic Astrology", accent: "#C5A66B", tint: "rgba(197,166,107,0.10)", description: "Decode the celestial blueprint of your life through ancient Jyotish wisdom — career, relationships, health and purpose from your precise chart." },
  { title: "Hypnotherapy", subtitle: "Clinical Hypnotherapy", accent: "#C4A0B9", tint: "rgba(196,160,185,0.12)", description: "Access the subconscious mind to dissolve limiting beliefs, heal emotional wounds, and reprogram old patterns." },
  { title: "Past Life Regression", subtitle: "Karmic Healing", accent: "#D4A0A0", tint: "rgba(212,160,160,0.12)", description: "Journey into past lifetimes to uncover the roots of present-day blocks, phobias and recurring patterns." },
  { title: "Subliminal Reconditioning", subtitle: "Subconscious Rewiring", accent: "#9DB4A0", tint: "rgba(157,180,160,0.14)", description: "Targeted subliminal programs that shift deep beliefs around abundance, confidence and self-worth." },
  { title: "Vastu Harmonics", subtitle: "Sacred Space Design", accent: "#7E8AA0", tint: "rgba(126,138,160,0.12)", description: "Align your living and working spaces to invite prosperity, harmony and positive energy flow." },
  { title: "Tarot + Intuitive Reading", subtitle: "Divination & Guidance", accent: "#B8935A", tint: "rgba(184,147,90,0.10)", description: "A mirror to your inner landscape through the sacred language of Tarot — and light on the path ahead." },
];

function bookOnWhatsApp(service: string) {
  const msg = encodeURIComponent(`Hi Dr. Nidhi, I'd like to book a ${service} session (via the app).`);
  Linking.openURL(`https://wa.me/${WHATSAPP}?text=${msg}`);
}

export default function Book() {
  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Work with Dr. Nidhi</Eyebrow>
        <Title>Book a session</Title>
        <Sub>75,000+ consultations. Choose what you need — booking happens on WhatsApp or the website.</Sub>
      </View>

      {SERVICES.map((s) => (
        <Card key={s.title} tint={s.tint} borderColor={`${s.accent}44`}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: s.accent }}>
            {s.subtitle}
          </Text>
          <Serif size={22} style={{ marginTop: 6 }}>{s.title}</Serif>
          <Sub>{s.description}</Sub>
          <View style={{ marginTop: 14 }}>
            <Btn label="Book on WhatsApp" color={colors.deepPlum} onPress={() => bookOnWhatsApp(s.title)} />
          </View>
        </Card>
      ))}

      <Btn label="See prices & book on the website" kind="ghost" onPress={() => Linking.openURL(`${SITE_URL}/booking`)} />
    </Screen>
  );
}
