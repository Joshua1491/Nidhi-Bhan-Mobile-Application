import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { Card, SectionLabel, Input, Btn } from "./ui";
import { logMood } from "../lib/portal/actions";

const MOODS = [
  { v: 1, label: "Heavy", emoji: "🌧" },
  { v: 2, label: "Low", emoji: "🌫" },
  { v: 3, label: "Steady", emoji: "🌤" },
  { v: 4, label: "Bright", emoji: "☀️" },
  { v: 5, label: "Radiant", emoji: "✨" },
];

export default function MoodCheckIn({ userId, initialMood }: { userId: string; initialMood: number | null }) {
  const [mood, setMood] = useState<number | null>(initialMood);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(Boolean(initialMood));
  const [saving, setSaving] = useState(false);

  async function save(v: number) {
    setMood(v); setSaving(true);
    await logMood(userId, v, null, note.trim() || null);
    setSaving(false); setSaved(true);
  }

  return (
    <View>
      <SectionLabel>How are you arriving today?</SectionLabel>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {MOODS.map((m) => (
            <Pressable key={m.v} onPress={() => save(m.v)} style={{ alignItems: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
                backgroundColor: mood === m.v ? colors.goldTint : "rgba(255,255,255,0.7)",
                borderWidth: 1.5, borderColor: mood === m.v ? colors.softGold : colors.cardBorder,
              }}>
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              </View>
              <Text style={{
                fontFamily: mood === m.v ? fonts.sansMedium : fonts.sans, fontSize: 11.5,
                color: mood === m.v ? colors.warmGold : colors.textMuted,
              }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {saved ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 14, textAlign: "center" }}>
            Noted for today. You can change it any time.
          </Text>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            <Input placeholder="A word about why (optional)" value={note} onChangeText={setNote} />
          </View>
        )}
      </Card>
    </View>
  );
}
