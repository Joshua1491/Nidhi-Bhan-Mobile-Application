// Book a session — the LIVE catalogue, not a copy of it.
//
// This screen used to hardcode six services. Then the portal made the
// catalogue database-driven: Dr. Nidhi renames, reprices, hides and
// adds services from her own panel, and the website reads it live. A
// hardcoded list here meant the app would drift out of truth the first
// time she touched anything. Now the app asks public.service_catalogue()
// — the same function the website uses — and falls back to the website
// link if the network has nothing to say.
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking, Pressable, Text, View } from "react-native";
import { Btn, Card, Eyebrow, Loading, Screen, Serif, Sub, Title } from "../../../components/ui";
import { SITE_URL } from "../../../lib/api";
import type { CatalogueService } from "../../../lib/portal/types";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

const WHATSAPP = "19052675523";

// The visual identity stays local; the truth about services does not.
const ACCENTS = ["#C5A66B", "#C4A0B9", "#D4A0A0", "#9DB4A0", "#7E8AA0", "#B8935A"];

function bookOnWhatsApp(service: string) {
  const msg = encodeURIComponent(`Hi Dr. Nidhi, I'd like to book a ${service} session (via the app).`);
  Linking.openURL(`https://wa.me/${WHATSAPP}?text=${msg}`);
}

function priceLine(s: CatalogueService): string | null {
  const parts: string[] = [];
  if (s.price_cents != null) {
    parts.push(`$${(s.price_cents / 100).toFixed(0)} ${s.currency ?? "CAD"}`);
  }
  if (s.sessions && s.sessions > 1) parts.push(`${s.sessions} sessions`);
  if (s.duration_min) parts.push(`${s.duration_min} min`);
  if (s.virtual) parts.push("online");
  return parts.length ? parts.join(" · ") : null;
}

export default function Book() {
  const catalogue = useQuery({
    queryKey: ["service-catalogue"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("service_catalogue");
      if (error) throw error;
      return (data ?? []) as CatalogueService[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const services = catalogue.data ?? [];

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

      {catalogue.isLoading ? (
        <Loading />
      ) : services.length === 0 ? (
        // Offline, or the catalogue is momentarily unreachable — the
        // website is the source of truth either way.
        <Card>
          <Serif size={20}>The full list lives on the website</Serif>
          <Sub>We couldn&apos;t load the current services just now. Prices and booking are always up to date there.</Sub>
        </Card>
      ) : (
        services.map((s, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          const price = priceLine(s);
          return (
            <Card key={s.slug} tint={`${accent}1A`} borderColor={`${accent}44`}>
              {price ? (
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: accent }}>
                  {price}
                </Text>
              ) : null}
              <Serif size={22} style={{ marginTop: 6 }}>{s.name}</Serif>
              {s.description ? <Sub>{s.description}</Sub> : null}
              <View style={{ marginTop: 14 }}>
                <Btn label="Book on WhatsApp" color={colors.deepPlum} onPress={() => bookOnWhatsApp(s.name)} />
              </View>
            </Card>
          );
        })
      )}

      <Btn label="See prices & book on the website" kind="ghost" onPress={() => Linking.openURL(`${SITE_URL}/booking`)} />
    </Screen>
  );
}
