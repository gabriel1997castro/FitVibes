import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Modal, Platform, Linking } from 'react-native';
import { supabase } from '../services/supabase';
import { useRouter } from 'expo-router';
import { GoogleSignin, GoogleSigninButton, isSuccessResponse, User } from '@react-native-google-signin/google-signin';
import Button from '../components/Button';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive'],
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB
})

export default function LoginScreen() {
  // const [auth, setAuth] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setSigningUp(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { name: signUpName } },
    });
    setSigningUp(false);
    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
    } else {
      setShowSignUp(false);
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpName('');
      Alert.alert('Sucesso', 'Conta criada! Verifique seu e-mail para confirmar.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const playServices = await GoogleSignin.hasPlayServices()
      console.log({playServices})
      const response = await GoogleSignin.signIn()
      console.log({response})
      if(isSuccessResponse(response)) {

        const { data, error} = await supabase.auth.signInWithIdToken({ provider: 'google', token: response.data.idToken })
        console.log(data, error)

      } else throw new Error('Google sign in failed');
    } catch (error) {
      console.log('Catch error:', error);
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FitVibes</Text>
        <Text style={styles.subtitle}>Treine com a galera, entre na vibe fit!</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}

          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

         {/*} <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Continuar com Google</Text>
          </TouchableOpacity>*/}

          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Light}
            onPress={handleGoogleLogin}
            disabled={loading}
          />

          <Button
          title='Continuar com Apple'
            style={styles.socialButton}
            onPress={handleAppleLogin}
            disabled={loading}
            textStyle={styles.socialButtonText}
           />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <Button
              title="Cadastre-se"
              onPress={() => router.push('/register')}
              variant="link"
              textStyle={styles.registerLink}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 16,
  },
  socialButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
}); 