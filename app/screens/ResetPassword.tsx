import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../services/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Button from "../components/Button";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Set flag to indicate we're in password reset mode
    AsyncStorage.setItem("password_reset_mode", "true");
    setIsResettingPassword(true);
    handleAuthSession();

    // Cleanup function
    return () => {
      AsyncStorage.removeItem("password_reset_mode");
    };
  }, []);

  const handleAuthSession = async () => {
    try {
      // Try to get the URL from multiple sources
      let url = await Linking.getInitialURL();

      // If no initial URL, check if we stored it during deep link handling
      if (!url) {
        url = await AsyncStorage.getItem("reset_password_url");
        if (url) {
          console.log("Retrieved URL from storage:", url);
          await AsyncStorage.removeItem("reset_password_url"); // Clean up
        }
      }

      console.log("Reset password URL:", url);

      if (url) {
        // Parse tokens from URL - they can be in query params or fragment
        let access_token, refresh_token, type;

        try {
          const urlObj = new URL(url);

          // Check query parameters first
          access_token = urlObj.searchParams.get("access_token");
          refresh_token = urlObj.searchParams.get("refresh_token");
          type = urlObj.searchParams.get("type");

          // If not in query params, check the hash fragment
          if (!access_token && urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            access_token = hashParams.get("access_token");
            refresh_token = hashParams.get("refresh_token");
            type = hashParams.get("type");
          }

          // If still not found, try manual parsing of the fragment
          if (!access_token && urlObj.hash) {
            const fragment = urlObj.hash.substring(1);
            const matches = {
              access_token: fragment.match(/access_token=([^&]+)/)?.[1],
              refresh_token: fragment.match(/refresh_token=([^&]+)/)?.[1],
              type: fragment.match(/type=([^&]+)/)?.[1],
            };
            access_token = matches.access_token;
            refresh_token = matches.refresh_token;
            type = matches.type;
          }
        } catch (urlError) {
          console.error("URL parsing error:", urlError);
          // Fallback to manual string parsing
          const tokenMatch = url.match(/access_token=([^&]+)/);
          const refreshMatch = url.match(/refresh_token=([^&]+)/);
          const typeMatch = url.match(/type=([^&]+)/);

          access_token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
          refresh_token = refreshMatch
            ? decodeURIComponent(refreshMatch[1])
            : null;
          type = typeMatch ? decodeURIComponent(typeMatch[1]) : null;
        }

        console.log("Parsed tokens:", {
          access_token: access_token
            ? access_token.substring(0, 10) + "..."
            : null,
          refresh_token: !!refresh_token,
          type,
        });

        if (access_token && refresh_token && type === "recovery") {
          try {
            // Set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            console.log("Session set result:", {
              user: !!data?.user,
              session: !!data?.session,
              error,
            });

            if (error) {
              console.error("Session error:", error);
              Alert.alert(
                "Erro",
                "Link de recuperação inválido ou expirado: " + error.message,
                [{ text: "OK", onPress: () => router.replace("/login") }]
              );
              return;
            }

            if (data?.session) {
              setSessionReady(true);
            } else {
              Alert.alert("Erro", "Não foi possível estabelecer a sessão", [
                { text: "OK", onPress: () => router.replace("/login") },
              ]);
            }
          } catch (sessionError) {
            console.error("Session setup error:", sessionError);
            Alert.alert(
              "Erro",
              "Erro ao configurar sessão: " + sessionError.message,
              [{ text: "OK", onPress: () => router.replace("/login") }]
            );
          }
        } else {
          console.log("Missing tokens or wrong type. Got:", {
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token,
            type,
          });
          Alert.alert("Erro", "Link de recuperação inválido ou incompleto", [
            { text: "OK", onPress: () => router.replace("/forgot-password") },
          ]);
        }
      } else {
        // Check if there's already a valid session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Existing session:", !!session);
        if (session) {
          setSessionReady(true);
        } else {
          Alert.alert(
            "Erro",
            "Nenhuma URL de recuperação detectada. Por favor, clique no link do email novamente.",
            [{ text: "OK", onPress: () => router.replace("/forgot-password") }]
          );
        }
      }
    } catch (error) {
      console.error("Auth session error:", error);
      Alert.alert(
        "Erro",
        "Erro ao processar link de recuperação: " + error.message,
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      // Check session before updating
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Current session before update:", !!session);

      if (!session) {
        Alert.alert(
          "Erro",
          "Sessão expirada. Por favor, solicite um novo link de recuperação.",
          [{ text: "OK", onPress: () => router.replace("/forgot-password") }]
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Sign out the user so they need to log in with the new password
      await supabase.auth.signOut();

      // Clean up the password reset mode flag
      await AsyncStorage.removeItem("password_reset_mode");

      Alert.alert(
        "Sucesso",
        "Sua senha foi redefinida com sucesso! Faça login com sua nova senha.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      console.error("Update password error:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível atualizar a senha"
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while establishing session
  if (!sessionReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <MaterialCommunityIcons name="lock-check" size={120} color="#FF6B35" />
        <Text style={styles.title}>Processando...</Text>
        <Text style={styles.subtitle}>Verificando link de recuperação</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="lock-check"
            size={120}
            color="#FF6B35"
          />
          <Text style={styles.title}>Nova Senha</Text>
          <Text style={styles.subtitle}>Digite sua nova senha</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nova Senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Nova Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Button
            title="Redefinir Senha"
            onPress={handleUpdatePassword}
            loading={loading}
            disabled={loading}
            style={styles.updateButton}
            textStyle={styles.updateButtonText}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B35",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  debugLink: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
