import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { supabase } from "../services/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Button from "../components/Button";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, insira seu email");
      return;
    }

    try {
      setLoading(true);

      // Supabase will send a password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "com.fitvibes.app://reset-password", // Deep link for your app
      });

      if (error) throw error;

      Alert.alert(
        "Email Enviado",
        "Verifique sua caixa de entrada. Enviamos um link para redefinir sua senha.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Reset password error:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível enviar o email de recuperação"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="lock-reset"
            size={120}
            color="#FF6B35"
          />
          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Digite seu email para receber instruções de recuperação
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Button
            title="Enviar Link de Recuperação"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
            style={styles.resetButton}
            textStyle={styles.resetButtonText}
          />

          <Button
            title="Voltar ao Login"
            onPress={() => router.replace("/login")}
            variant="link"
            textStyle={styles.backLink}
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
    paddingHorizontal: 20,
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
  resetButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backLink: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
});
