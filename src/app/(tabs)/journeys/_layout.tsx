import { Stack } from "expo-router";
import { colors } from "../../../theme";

export default function JourneysLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />;
}
