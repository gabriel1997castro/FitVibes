import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from './services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function JoinGroupScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(code as string || '');
  const [email, setEmail] = useState('');

  const handleJoinWithCode = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if invite code exists and is valid
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        throw new Error('Código de convite inválido ou expirado');
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (existingMember) {
        throw new Error('Você já é membro deste grupo');
      }

      // Add user to group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      // Mark invite as used
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      Alert.alert('Sucesso', 'Você entrou no grupo com sucesso!');
      router.replace('/groups');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível entrar no grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithEmail = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if email exists in users table
      const { data: invitedUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !invitedUser) {
        throw new Error('Usuário não encontrado');
      }

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create invite
      const { error: inviteError } = await supabase
        .from('group_invites')
        .insert({
          invited_by: user.id,
          invite_code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

      if (inviteError) throw inviteError;

      Alert.alert(
        'Convite Enviado',
        'Um convite foi enviado para o email informado.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível enviar o convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Entrar em um Grupo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usar Código de Convite</Text>
          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Digite o código de convite"
            autoCapitalize="characters"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, !inviteCode && styles.buttonDisabled]}
            onPress={handleJoinWithCode}
            disabled={!inviteCode || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar no Grupo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Convidar por Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o email do convidado"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, !email && styles.buttonDisabled]}
            onPress={handleJoinWithEmail}
            disabled={!email || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar Convite</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
    color: '#6B7280',
    marginHorizontal: 12,
  },
}); 