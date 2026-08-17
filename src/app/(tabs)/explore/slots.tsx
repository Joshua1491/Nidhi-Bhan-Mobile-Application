// Pick a time — real availability, booked for real, in the app.
//
// The days come from the same slot generator the website's booking
// page uses (her availability rules minus everything already on the
// calendar), grouped by YOUR timezone. The book call re-checks the
// slot server-side at the last moment and lets the database settle a
// tie — the same wiring, beat for beat, as the web.
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Btn, Card, Chip, Eyebrow, Loading, Screen, Serif, Sub, Title } from "../../../components/ui";
import { bookAppointment, bookableSlots } from "../../../lib/api";
import { useSession } from "../../../lib/session";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

function timeLabel(startMs: number): string {
  return new Date(startMs).toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit",
  });
}

/** "GMT+5:30" / "EDT" — whatever the device calls its own zone. */
function deviceTzLabel(): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export default function Slots() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const serviceSlug = service || "birth-chart-diagnosis";
  const { session } = useSession();
  const userId = session!.user.id;

  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  const slots = useQuery({
    queryKey: ["slots", serviceSlug],
    queryFn: () => bookableSlots(serviceSlug),
    staleTime: 60_000,
  });

  // Dr. Bhan's rule: every client reachable. If no number is on file,
  // the confirm card asks for one with the first booking.
  const clientPhone = useQuery({
    queryKey: ["clientPhone", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients").select("phone").eq("user_id", userId).maybeSingle();
      return (data?.phone as string | null) ?? null;
    },
  });
  const needsPhone = clientPhone.isSuccess && !(clientPhone.data ?? "").trim();
  const phoneOk = phone.replace(/\D/g, "").length >= 7;

  const book = useMutation({
    mutationFn: (startMs: number) =>
      bookAppointment(slots.data!.service.id, startMs, needsPhone ? phone.trim() : undefined),
    onSuccess: (result) => {
      if (result.ok) {
        router.replace("/explore/sessions");
      } else {
        // "Someone just took that time" (or the server wants a phone
        // number) — surface the sentence and let them fix it.
        setOutcome(result.message);
        if (!result.needPhone) {
          setPicked(null);
          slots.refetch();
        }
        if (result.needPhone) clientPhone.refetch();
      }
    },
  });

  if (slots.isLoading) return <Screen><Loading /></Screen>;

  const data = slots.data;
  const days = (data?.days ?? []).filter((d) => d.slots.length > 0);
  const day = days[Math.min(dayIdx, Math.max(0, days.length - 1))];

  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>← Back</Text>
      </Pressable>
      <View>
        <Eyebrow>{data?.service.name ?? "Book a session"}</Eyebrow>
        <Title>Choose{"\n"}your time</Title>
        <Sub>
          Times are shown in your timezone{deviceTzLabel() ? ` (${deviceTzLabel()})` : ""}
          {data?.service.durationMin ? ` · ${data.service.durationMin} minutes` : ""}.
        </Sub>
      </View>

      {outcome ? (
        <Card tint="rgba(212,160,160,0.10)" borderColor="rgba(212,160,160,0.4)">
          <Sub>{outcome}</Sub>
        </Card>
      ) : null}

      {!data || days.length === 0 ? (
        <Card>
          <Serif size={20}>No open times right now</Serif>
          <Sub>
            The calendar may be full for the next few weeks — message Dr. Nidhi
            and she&apos;ll find you a time.
          </Sub>
          <View style={{ marginTop: 12 }}>
            <Btn label="Write to Dr. Nidhi" kind="ghost" onPress={() => router.replace("/explore/messages")} />
          </View>
        </Card>
      ) : (
        <>
          {/* Day strip */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {days.slice(0, 14).map((d, i) => (
              <Chip
                key={d.date}
                label={dayLabel(d.date)}
                active={i === dayIdx}
                onPress={() => { setDayIdx(i); setPicked(null); }}
              />
            ))}
          </View>

          {/* Slots for the chosen day */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {day.slots.map((s) => (
              <Chip
                key={s.startMs}
                label={timeLabel(s.startMs)}
                active={picked === s.startMs}
                onPress={() => setPicked(s.startMs)}
              />
            ))}
          </View>

          {picked ? (
            <Card tint="rgba(197,166,107,0.08)" borderColor="rgba(197,166,107,0.3)">
              <Serif size={20}>
                {dayLabel(day.date)} · {timeLabel(picked)}
              </Serif>
              <Sub>{data.service.name} · {data.service.durationMin} minutes with Dr. Nidhi.</Sub>
              {needsPhone ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.textMuted, marginBottom: 6 }}>
                    WhatsApp number (with country code)
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. +1 416 555 0123"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    style={{
                      borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12,
                      paddingHorizontal: 14, paddingVertical: 12,
                      fontFamily: fonts.sans, fontSize: 15, color: colors.charcoal,
                      backgroundColor: "#fff",
                    }}
                  />
                  <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                    Dr. Nidhi&apos;s team confirms every session on WhatsApp.
                  </Text>
                </View>
              ) : null}
              <View style={{ marginTop: 12 }}>
                <Btn
                  label={book.isPending ? "Booking…" : "Book this time"}
                  color={colors.deepPlum}
                  onPress={() => {
                    if (book.isPending) return;
                    if (needsPhone && !phoneOk) {
                      setOutcome("Please add your WhatsApp number above to book.");
                      return;
                    }
                    book.mutate(picked);
                  }}
                />
              </View>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
