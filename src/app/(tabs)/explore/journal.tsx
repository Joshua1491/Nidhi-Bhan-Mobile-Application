// Reflections — private journal with a daily prompt (AI-personalized when available).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Btn, Card, Eyebrow, Input, Loading, Screen, SectionLabel, Serif, Sub, Title } from "../../../components/ui";
import { aiReading } from "../../../lib/api";
import { getJournalPrompt } from "../../../lib/astro/engine";
import { addJournalEntry, deleteJournalEntry } from "../../../lib/portal/actions";
import { getBundle } from "../../../lib/portal/bundle";
import type { JournalEntry } from "../../../lib/portal/types";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function Journal() {
  const { session } = useSession();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const portal = useQuery({ queryKey: ["portal", userId], queryFn: () => getBundle(userId) });
  const entries = useQuery({
    queryKey: ["journal", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("id, entry_date, prompt, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as JournalEntry[];
    },
  });
  const aiPrompt = useQuery({
    queryKey: ["ai-journal-prompt", userId, new Date().toISOString().slice(0, 10)],
    queryFn: () => aiReading<{ prompt: string }>("journal-prompt"),
    enabled: portal.data?.bundle.source === "live",
    staleTime: Infinity,
  });

  if (entries.isLoading) return <Screen><Loading /></Screen>;
  const prompt = aiPrompt.data?.prompt ?? getJournalPrompt(new Date());
  const list = entries.data ?? [];

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    await addJournalEntry(userId, draft, prompt);
    setDraft(""); setSaving(false);
    qc.invalidateQueries({ queryKey: ["journal", userId] });
  }

  function confirmDelete(id: string) {
    Alert.alert("Delete this reflection?", "This can't be undone.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteJournalEntry(userId, id);
          qc.invalidateQueries({ queryKey: ["journal", userId] });
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen refreshing={entries.isRefetching} onRefresh={() => qc.invalidateQueries({ queryKey: ["journal", userId] })}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Explore</Text>
        </Pressable>
        <View>
          <Eyebrow>Reflections</Eyebrow>
          <Title>What the day{"\n"}is trying to say</Title>
        </View>

        <Card tint="rgba(196,160,185,0.10)" borderColor="rgba(196,160,185,0.35)">
          <Eyebrow color={colors.mauve}>Today's prompt</Eyebrow>
          <Serif size={20} style={{ marginTop: 8, fontFamily: "CormorantGaramond_400Regular" }}>{prompt}</Serif>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input
              value={draft} onChangeText={setDraft} multiline placeholder="Write freely — this is only for you."
              style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }}
            />
            <Btn label="Save reflection" onPress={save} loading={saving} disabled={!draft.trim()} color={colors.mauve} />
          </View>
        </Card>

        {list.length ? (
          <View>
            <SectionLabel>Past reflections</SectionLabel>
            <View style={{ gap: 12 }}>
              {list.map((e) => (
                <Card key={e.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.textMuted }}>
                      {new Date(e.created_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                    </Text>
                    <Pressable onPress={() => confirmDelete(e.id)}>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted }}>Delete</Text>
                    </Pressable>
                  </View>
                  {e.prompt ? (
                    <Text style={{ fontFamily: fonts.serif, fontSize: 15, fontStyle: "italic", color: colors.textSecondary, marginTop: 6 }}>
                      {e.prompt}
                    </Text>
                  ) : null}
                  <Text style={{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary, marginTop: 6 }}>
                    {e.content}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        ) : (
          <Sub>No reflections yet — today's a good day to begin.</Sub>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
