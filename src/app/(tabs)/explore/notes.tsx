// Dr. Nidhi's Notes — session notes written by the practitioner, read-only.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card, Eyebrow, Loading, Screen, Serif, Sub, Title } from "../../../components/ui";
import type { SessionNote } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function Notes() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();

  const notes = useQuery({
    queryKey: ["notes", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("session_notes")
        .select("id, title, body, session_type, session_date, created_at")
        .eq("client_user_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []) as SessionNote[];
    },
  });

  if (notes.isLoading) return <Screen><Loading /></Screen>;
  const list = notes.data ?? [];

  return (
    <Screen refreshing={notes.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["notes", userId] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Notes from Dr. Nidhi</Eyebrow>
        <Title>Your guidance,{"\n"}kept close</Title>
        <Sub>
          After a session, Dr. Nidhi's personal notes and next steps land here — so you're
          never left holding a reading alone.
        </Sub>
      </View>

      {list.length ? (
        <View style={{ gap: 12 }}>
          {list.map((n) => (
            <Card key={n.id}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: colors.warmGold }}>
                {n.session_type ?? "Session"} ·{" "}
                {new Date(n.session_date ?? n.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </Text>
              {n.title ? <Serif size={20} style={{ marginTop: 6 }}>{n.title}</Serif> : null}
              <Text style={{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary, marginTop: 8 }}>
                {n.body}
              </Text>
            </Card>
          ))}
        </View>
      ) : (
        <Card style={{ alignItems: "center", paddingVertical: 34 }}>
          <Text style={{ fontSize: 26 }}>🕊</Text>
          <Serif size={20} style={{ marginTop: 8 }}>Nothing here yet</Serif>
          <Sub style={{ textAlign: "center" }}>
            After your next session with Dr. Nidhi, her notes for you will appear here.
          </Sub>
        </Card>
      )}
    </Screen>
  );
}
