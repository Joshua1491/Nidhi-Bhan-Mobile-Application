// ============================================================
// Push registration and tap-routing.
//
// On sign-in the device asks for permission, fetches its Expo push
// token and upserts it into push_tokens under RLS — its own row, and
// only its own. The portal's server does the sending (messages,
// published notes, session reminders); tapping a notification routes
// by the tiny { screen } payload the server attached.
//
// HONEST LIMITS, stated here so nobody debugs a non-bug later:
//   · Expo Go (SDK 53+) cannot receive remote pushes — a development
//     build or the store build is where this becomes real.
//   · getExpoPushTokenAsync needs the EAS projectId. Until EAS is
//     configured (app.json → extra.eas.projectId), registration skips
//     quietly and everything else works without it.
// ============================================================
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "./supabase";

// Foreground behaviour: show the banner. A message from Dr. Nidhi
// while the app is open should still be seen, just not loudly.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Register this device's push token for the signed-in user. */
export async function registerForPush(userId: string): Promise<void> {
  try {
    // Simulators have no push service; asking just logs noise.
    if (!Device.isDevice) return;

    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return; // EAS not configured yet — skip quietly.

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Dr. Nidhi",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;

    await supabase.from("push_tokens").upsert(
      { token, user_id: userId, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );
  } catch {
    // Push is a nicety. Never let it break sign-in.
  }
}

/** Remove this device's token — called on sign-out. */
export async function unregisterPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (token) await supabase.from("push_tokens").delete().eq("token", token);
  } catch {
    // Best-effort; a stale token also gets pruned server-side.
  }
}

/** Route a notification tap by the server's { screen } payload. */
export function wireNotificationTaps(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = String(response.notification.request.content.data?.screen ?? "");
    if (screen === "messages") router.push("/explore/messages" as never);
    else if (screen === "notes") router.push("/explore/notes" as never);
    else if (screen === "sessions") router.push("/explore/sessions" as never);
  });
  return () => sub.remove();
}
