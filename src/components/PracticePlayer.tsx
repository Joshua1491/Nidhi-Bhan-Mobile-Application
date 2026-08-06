import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "../theme";

export default function PracticePlayer({
  title, minutes, kind, note, script, variant = "day",
}: {
  title: string; minutes: number; kind: string; note: string; script: string;
  variant?: "day" | "evening";
}) {
  const [open, setOpen] = useState(false);
  const evening = variant === "evening";

  return (
    <View style={{
      borderRadius: radius.card, overflow: "hidden", borderWidth: 1,
      borderColor: evening ? "rgba(197,166,107,0.25)" : colors.cardBorder,
      backgroundColor: evening ? "rgba(52,40,56,0.97)" : colors.card,
    }}>
      <View style={{ padding: 20 }}>
        <Text style={{
          fontFamily: fonts.sansMedium, fontSize: 10.5, letterSpacing: 2.6, textTransform: "uppercase",
          color: evening ? "rgba(197,166,107,0.9)" : colors.warmGold,
        }}>
          {kind} · {minutes} min
        </Text>
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable
            onPress={() => setOpen(!open)}
            style={{
              width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center",
              backgroundColor: evening ? "rgba(197,166,107,0.16)" : colors.goldTint,
              borderWidth: 1, borderColor: "rgba(197,166,107,0.35)",
            }}
          >
            <Text style={{ fontSize: 16, color: evening ? colors.softGold : colors.warmGold }}>
              {open ? "–" : "▷"}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: fonts.serifMedium, fontSize: 20,
              color: evening ? "#F5EFE6" : colors.charcoal,
            }}>
              {title}
            </Text>
            <Text style={{
              fontFamily: fonts.sans, fontSize: 13, marginTop: 2, lineHeight: 18,
              color: evening ? "rgba(245,239,230,0.7)" : colors.textSecondary,
            }}>
              {note}
            </Text>
          </View>
        </View>
        {open ? (
          <Text style={{
            fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 23, marginTop: 16,
            color: evening ? "rgba(245,239,230,0.92)" : colors.textPrimary,
          }}>
            {script}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
