// Messages — the thread with Dr. Nidhi, attached to your record.
//
// Same table, same RLS as the website's portal thread: the client
// reads their own thread, writes with author pinned to 'client' by
// the database (sending as 'practitioner' is rejected by policy, not
// by politeness), and marks her messages read on open.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Btn, Card, Eyebrow, Loading, Screen, Serif, Sub, Title } from "../../../components/ui";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

const MAX_MESSAGE_CHARS = 4000;

interface Message {
  id: string;
  author: "practitioner" | "client";
  body: string;
  created_at: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function Messages() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const clientRow = useQuery({
    queryKey: ["client-row", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients").select("id").eq("user_id", userId).maybeSingle();
      return data as { id: string } | null;
    },
  });
  const clientId = clientRow.data?.id ?? null;

  const thread = useQuery({
    queryKey: ["messages", clientId],
    enabled: Boolean(clientId),
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, author, body, created_at")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: true })
        .limit(200);
      return (data ?? []) as Message[];
    },
  });

  // Her words, marked read on open — same as the web portal.
  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("client_id", clientId)
      .eq("author", "practitioner")
      .is("read_at", null)
      .then(() => {});
  }, [clientId, thread.data?.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || !clientId) return;
      const { error } = await supabase
        .from("messages")
        .insert({ client_id: clientId, author: "client", body: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages", clientId] });
    },
  });

  if (clientRow.isLoading || (clientId && thread.isLoading)) {
    return <Screen><Loading /></Screen>;
  }

  const rows = thread.data ?? [];

  return (
    <Screen refreshing={thread.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["messages", clientId] })}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
      </Pressable>
      <View>
        <Eyebrow>Between sessions</Eyebrow>
        <Title>Write to{"\n"}Dr. Nidhi</Title>
        <Sub>Anything you send here reaches her directly and stays with your record — unlike WhatsApp.</Sub>
      </View>

      {!clientId ? (
        <Card>
          <Serif size={20}>Almost there</Serif>
          <Sub>
            Your account isn&apos;t linked to a client record yet. Once Dr. Nidhi has
            added you, your conversation will appear here.
          </Sub>
        </Card>
      ) : (
        <>
          {rows.length === 0 ? (
            <Card>
              <Sub>No messages yet. Anything you write below reaches Dr. Nidhi directly.</Sub>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {rows.map((m) => (
                <View
                  key={m.id}
                  style={{
                    alignSelf: m.author === "client" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    backgroundColor: m.author === "client" ? "rgba(61,43,61,0.92)" : "rgba(255,255,255,0.75)",
                    borderRadius: 16,
                    borderBottomRightRadius: m.author === "client" ? 4 : 16,
                    borderBottomLeftRadius: m.author === "client" ? 16 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21,
                    color: m.author === "client" ? "#FBF8F4" : colors.charcoal,
                  }}>
                    {m.body}
                  </Text>
                  <Text style={{
                    fontFamily: fonts.sans, fontSize: 10.5, marginTop: 4,
                    color: m.author === "client" ? "rgba(251,248,244,0.55)" : colors.textSecondary,
                  }}>
                    {m.author === "practitioner" ? "Dr. Nidhi · " : ""}{fmt(m.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ gap: 10 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={MAX_MESSAGE_CHARS}
              placeholder="Anything you'd like to tell Dr. Nidhi before your next session…"
              placeholderTextColor={colors.textSecondary}
              style={{
                fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21,
                color: colors.charcoal, backgroundColor: "rgba(255,255,255,0.85)",
                borderColor: "rgba(197,166,107,0.28)", borderWidth: 1,
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                minHeight: 76, textAlignVertical: "top",
              }}
            />
            <Btn
              label={send.isPending ? "Sending…" : "Send"}
              color={colors.deepPlum}
              onPress={() => !send.isPending && send.mutate(draft)}
            />
            {send.isError ? (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: "#8f4444" }}>
                That didn&apos;t send. Please try again.
              </Text>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}
