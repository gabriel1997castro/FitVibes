import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Modal, Platform } from 'react-native';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Error', error.message);
    } else {
      Alert.alert('Success', 'Logged in!');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google login not implemented yet.');
  };

  const handleAppleLogin = () => {
    Alert.alert('Apple Login', 'Apple login not implemented yet.');
  };

  return (
    <View style={styles.gradientBg}>
      <View style={styles.container}>
        {/* Logo Placeholder */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🏋️‍♂️</Text>
        </View>
        <Text style={styles.appName}>FitVibes</Text>
        <Text style={styles.slogan}>Treine com a galera, entre na vibe fit!</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={[styles.loginButton, styles.google]} onPress={handleGoogleLogin}>
            <Text style={styles.buttonText}>Entrar com Google</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={[styles.loginButton, styles.apple]} onPress={handleAppleLogin}>
              <Text style={styles.buttonText}>Entrar com Apple</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.loginButton, styles.email]} onPress={() => setShowEmailForm(true)}>
            <Text style={styles.buttonText}>Entrar com E-mail</Text>
          </TouchableOpacity>
        </View>
        <Modal visible={showEmailForm} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Login com E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Button title={loading ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={loading} />
              <Button title="Cancelar" onPress={() => setShowEmailForm(false)} color="#888" />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #FF6B35 0%, #8B5CF6 100%)', // fallback for web
    ...Platform.select({
      ios: { backgroundColor: '#FF6B35' },
      android: { backgroundColor: '#FF6B35' },
      default: {},
    }),
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: '#0002',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
    textShadowColor: '#0002',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  google: {
    backgroundColor: '#fff',
  },
  apple: {
    backgroundColor: '#000',
  },
  email: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF6B35',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
}); 