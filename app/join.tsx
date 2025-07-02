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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.contentCentered}>
        <MaterialCommunityIcons name="account-group" size={64} color="#FF6B35" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Entrar em um Grupo</Text>
        <Text style={styles.subtitle}>Digite o código de convite para participar de um grupo com seus amigos!</Text>
        <TextInput
          style={styles.input}
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="Código de convite"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#1F2937',
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#FFD6C2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 