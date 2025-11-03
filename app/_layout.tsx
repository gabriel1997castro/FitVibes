import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { supabase } from "./services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const handleAuthStateChange = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const isPasswordResetMode = await AsyncStorage.getItem(
        "password_reset_mode"
      );
      const isAuthRoute =
        segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "forgot-password" ||
        segments[0] === "reset-password";

      if (!session && !isAuthRoute) {
        // Redirect to the sign-in page if not signed in
        router.replace("/login");
      } else if (
        session &&
        isAuthRoute &&
        segments[0] !== "reset-password" &&
        !isPasswordResetMode
      ) {
        // Redirect to the tab bar if signed in, but allow reset-password screen when in reset mode
        router.replace("/(tabs)/groups");
      }
    };

    handleAuthStateChange();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const isPasswordResetMode = await AsyncStorage.getItem(
        "password_reset_mode"
      );
      const isAuthRoute =
        segments[0] === "login" ||
        segments[0] === "register" ||
        segments[0] === "forgot-password" ||
        segments[0] === "reset-password";

      if (!session && !isAuthRoute) {
        // Redirect to the sign-in page if not signed in
        router.replace("/login");
      } else if (
        session &&
        isAuthRoute &&
        segments[0] !== "reset-password" &&
        !isPasswordResetMode
      ) {
        // Redirect to the tab bar if signed in, but allow reset-password screen when in reset mode
        router.replace("/(tabs)/groups");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [segments]);

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="join"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="groups/[id]"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="groups/[id]/post"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="groups/[id]/vote"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="groups/create"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="groups/[id]/activity/[activityId]"
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
