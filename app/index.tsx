import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "./services/supabase";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  useEffect(() => {
    checkUser();
    handleDeepLink();
  }, []);

  async function checkUser() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // User is signed in, redirect to home
        router.replace("/groups");
      } else {
        // No user is signed in, redirect to login
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      router.replace("/login");
    }
  }

  function handleDeepLink() {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(async (url) => {
      console.log("Initial URL:", url);
      if (
        url &&
        (url.includes("reset-password") ||
          url.includes("access_token") ||
          url.includes("type=recovery"))
      ) {
        console.log("Redirecting to reset-password from initial URL");
        // Store the URL for the reset password screen to access
        await AsyncStorage.setItem("reset_password_url", url);
        router.replace("/reset-password");
      }
    });

    // Handle URL changes while app is running
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      console.log("Deep link URL received:", url);
      if (
        url &&
        (url.includes("reset-password") ||
          url.includes("access_token") ||
          url.includes("type=recovery"))
      ) {
        console.log("Redirecting to reset-password from deep link");
        // Store the URL for the reset password screen to access
        await AsyncStorage.setItem("reset_password_url", url);
        router.replace("/reset-password");
      }
    });

    return () => subscription?.remove();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
