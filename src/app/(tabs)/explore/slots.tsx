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
import { Pressable, Text, View } from "react-native";
import { Btn, Card, Chip, Eyebrow, Loading, Screen, Serif, Sub, Title } from "../../../components/ui";
import { bookAppointment, bookableSlots } from "../../../lib/api";
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

export default function Slots() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const serviceSlug = service || "birth-chart-diagnosis";

  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const slots = useQuery({
    queryKey: ["slots", serviceSlug],
    queryFn: () => bookableSlots(serviceSlug),
    staleTime: 60_000,
  });

  const book = useMutation({
    mutationFn: (startMs: number) => bookAppointment(slots.data!.service.id, startMs),
    onSuccess: (result) => {
      if (result.ok) {
        router.replace("/explore/sessions");
      } else {
        // "Someone just took that time" — refresh the truth and let
        // them pick again.
        setOutcome(result.message);
        setPicked(null);
        slots.refetch();
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
          Times are shown in your timezone
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
              <View style={{ marginTop: 12 }}>
                <Btn
                  label={book.isPending ? "Booking…" : "Book this time"}
                  color={colors.deepPlum}
                  onPress={() => !book.isPending && book.mutate(picked)}
                />
              </View>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
