// Your sessions — upcoming with a way in, past with what happened.
//
// Reads the same my_appointments view the website's client portal
// reads, under the same RLS, and asks session_meeting_url() for the
// room — which resolves per-session room → her standing room →
// fallback, identically to the web. The app never guesses a link.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking, Pressable, Text, View } from "react-native";
import { Btn, Card, Eyebrow, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

interface Appointment {
  id: string;
  service_name: string | null;
  scheduled_at: string;
  duration_min: number | null;
  status: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Held",
  no_show: "Missed",
  cancelled: "Cancelled",
};

export default function Sessions() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const appts = useQuery({
    queryKey: ["appointments", userId],
    queryFn: async () => {
      const { data: client } = await supabase
        .from("clients").select("id").eq("user_id", userId).maybeSingle();
      if (!client) return [] as Appointment[];
      const { data } = await supabase
        .from("my_appointments")
        .select("id, service_name, scheduled_at, duration_min, status")
        .eq("client_id", client.id)
        .order("scheduled_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Appointment[];
    },
  });

  const joinSession = async (id: string) => {
    const { data: url } = await supabase.rpc("session_meeting_url", {
      p_appointment_id: id,
    });
    if (url) {
      Linking.openURL(url as string);
    }
  };

  if (appts.isLoading) return <Screen><Loading /></Screen>;
  const rows = appts.data ?? [];
  const now = Date.now();
  const upcoming = rows
    .filter((a) => a.status !== "cancelled" &&
      new Date(a.scheduled_at).getTime() + (a.duration_min ?? 60) * 60_000 > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = rows.filter((a) => !upcoming.includes(a));

  return (
    <Screen refreshing={appts.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["appointments", userId] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Your sessions</Eyebrow>
        <Title>Time held{"\n"}for you</Title>
        <Sub>Joining details appear here shortly before each session begins.</Sub>
      </View>

      {rows.length === 0 ? (
        <Card>
          <Serif size={20}>Nothing booked yet</Serif>
          <Sub>When you book a session, it appears here with everything you need to join.</Sub>
          <View style={{ marginTop: 12 }}>
            <Btn label="Book a session" onPress={() => router.push("/explore/book")} />
          </View>
        </Card>
      ) : null}

      {upcoming.length > 0 ? (
        <View>
          <SectionLabel>Upcoming</SectionLabel>
          <View style={{ gap: 12 }}>
            {upcoming.map((a) => (
              <Card key={a.id} tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: colors.warmGold }}>
                  {fmt(a.scheduled_at)}{a.duration_min ? ` · ${a.duration_min} min` : ""}
                </Text>
                <Serif size={20} style={{ marginTop: 6 }}>{a.service_name ?? "Session"}</Serif>
                <View style={{ marginTop: 12 }}>
                  <Btn label="Join your session" color={colors.deepPlum} onPress={() => joinSession(a.id)} />
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
                  If the room isn&apos;t open yet, Dr. Nidhi will send joining details before you start.
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {past.length > 0 ? (
        <View>
          <SectionLabel>Past</SectionLabel>
          <View style={{ gap: 12 }}>
            {past.slice(0, 10).map((a) => (
              <Card key={a.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>
                    {fmt(a.scheduled_at)}
                  </Text>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSecondary }}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </Text>
                </View>
                <Serif size={18} style={{ marginTop: 4 }}>{a.service_name ?? "Session"}</Serif>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
