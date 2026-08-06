// ============================================================
// Shared UI primitives — the portal's soft, luminous aesthetic:
// cream/lavender ambient background, glass cards, gold eyebrows,
// Cormorant Garamond display type.
// ============================================================
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, ViewStyle, TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius } from "../theme";

export function Screen({
  children, refreshing, onRefresh, padTop = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <LinearGradient
        colors={[colors.lavenderLight, colors.cream, colors.blushLight]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: padTop ? insets.top + 10 : 10,
          paddingBottom: 110,
          gap: 18,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.warmGold} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Eyebrow({ children, color = colors.warmGold }: { children: ReactNode; color?: string }) {
  return (
    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color }}>
      {children}
    </Text>
  );
}

export function Title({ children, size = 34 }: { children: ReactNode; size?: number }) {
  return (
    <Text style={{ fontFamily: fonts.serifLight, fontSize: size, lineHeight: size * 1.12, color: colors.charcoal, marginTop: 4 }}>
      {children}
    </Text>
  );
}

export function Sub({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <Text style={[{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginTop: 6 }, style]}>
      {children}
    </Text>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2.6, textTransform: "uppercase", color: colors.textMuted, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

export function Card({
  children, style, tint, borderColor,
}: { children: ReactNode; style?: ViewStyle; tint?: string; borderColor?: string }) {
  return (
    <View
      style={[{
        backgroundColor: tint ?? colors.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: borderColor ?? colors.cardBorder,
        padding: 20,
      }, style]}
    >
      {children}
    </View>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <Text style={[{ fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary }, style]}>
      {children}
    </Text>
  );
}

export function Serif({ children, size = 22, style }: { children: ReactNode; size?: number; style?: TextStyle }) {
  return (
    <Text style={[{ fontFamily: fonts.serifMedium, fontSize: size, lineHeight: size * 1.2, color: colors.charcoal }, style]}>
      {children}
    </Text>
  );
}

export function Chip({ label, color = colors.softGold, active = false, onPress }: {
  label: string; color?: string; active?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.chip,
        backgroundColor: active ? color : "rgba(255,255,255,0.7)",
        borderWidth: 1, borderColor: active ? color : colors.cardBorder,
      }}
    >
      <Text style={{
        fontFamily: fonts.sansMedium, fontSize: 12.5,
        color: active ? "#fff" : colors.textSecondary,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Btn({
  label, onPress, kind = "primary", disabled, loading, color,
}: {
  label: string; onPress: () => void;
  kind?: "primary" | "ghost"; disabled?: boolean; loading?: boolean; color?: string;
}) {
  const bg = kind === "primary" ? (color ?? colors.deepPlum) : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: radius.chip,
        borderWidth: kind === "ghost" ? 1 : 0,
        borderColor: colors.cardBorder,
        paddingVertical: 14, alignItems: "center", justifyContent: "center",
      })}
    >
      {loading ? (
        <ActivityIndicator color={kind === "primary" ? "#fff" : colors.warmGold} />
      ) : (
        <Text style={{
          fontFamily: fonts.sansMedium, fontSize: 15,
          color: kind === "primary" ? "#fff" : colors.charcoal, letterSpacing: 0.3,
        }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Input(props: React.ComponentProps<typeof TextInput> & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSecondary }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[{
          backgroundColor: "rgba(255,255,255,0.8)",
          borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.input,
          paddingHorizontal: 14, paddingVertical: 12,
          fontFamily: fonts.sansRegular, fontSize: 15, color: colors.textPrimary,
        }, style]}
        {...rest}
      />
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Text style={{ fontFamily: fonts.sansRegular, fontSize: 13.5, color: "#B4544C", lineHeight: 19 }}>
      {children}
    </Text>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 60, alignItems: "center" }}>
      <ActivityIndicator color={colors.warmGold} size="large" />
    </View>
  );
}
