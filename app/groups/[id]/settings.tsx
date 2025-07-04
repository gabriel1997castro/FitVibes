import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';

type Group = {
  id: string;
  name: string;
  description: string | null;
  theme_color: string | null;
  emoji: string;
  penalty_amount: number;
  payment_cycle: 'weekly' | 'monthly';
  created_by: string;
};

type Member = {
  id: string;
  user_id: string;
  group_id: string;
  role: 'admin' | 'member';
  users: {
    name: string;
    avatar_url: string | null;
  };
};

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPenaltyAmount, setEditedPenaltyAmount] = useState('');
  const [editedPaymentCycle, setEditedPaymentCycle] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      console.log('Current user:', user.id);
      console.log('Fetching members for group:', id);

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      setEditedName(groupData.name);
      setEditedDescription(groupData.description || '');
      setEditedPenaltyAmount(groupData.penalty_amount.toString());
      setEditedPaymentCycle(groupData.payment_cycle || 'weekly');
      console.log('Initial payment cycle:', groupData.payment_cycle);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          users (
            name,
            avatar_url
          )
        `)
        .eq('group_id', id);

      if (membersError) throw membersError;
      console.log('Members loaded:', membersData);
      console.log('Members count:', membersData?.length);
      console.log('Admin members:', membersData?.filter(m => m.role === 'admin'));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching group details:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do grupo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user is admin
      const userMember = members.find(m => m.user_id === user.id);
      if (userMember?.role !== 'admin') {
        throw new Error('Apenas administradores podem editar as configurações do grupo');
      }

      const { error } = await supabase
        .from('groups')
        .update({
          name: editedName,
          description: editedDescription || null,
          penalty_amount: parseFloat(editedPenaltyAmount),
          payment_cycle: editedPaymentCycle,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Configurações do grupo atualizadas com sucesso!');
      router.back();
    } catch (error) {
      console.error('Error saving group settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações do grupo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user is admin
      const userMember = members.find(m => m.user_id === user.id);
      if (userMember?.role !== 'admin') {
        throw new Error('Apenas administradores podem remover membros');
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Refresh members list
      fetchGroupDetails();
      Alert.alert('Sucesso', 'Membro removido com sucesso!');
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Erro', 'Não foi possível remover o membro.');
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user is admin
      const userMember = members.find(m => m.user_id === user.id);
      if (userMember?.role !== 'admin') {
        throw new Error('Apenas administradores podem gerar convites');
      }

      // Generate a random invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create invite in database
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .insert({
          group_id: id,
          invited_by: user.id,
          invite_code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        })
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invite:', inviteError);
        throw new Error(inviteError.message || 'Erro ao criar convite');
      }

      if (!invite) {
        throw new Error('Não foi possível criar o convite');
      }

      // Share invite link
      const inviteLink = `https://fitvibes.app/join/${inviteCode}`;
      await Share.share({
        message: `Venha participar do grupo ${group?.name} no FitVibes! Use o código: ${inviteCode}`,
        url: inviteLink,
      });
    } catch (error) {
      console.error('Error generating invite:', error);
      Alert.alert(
        'Erro',
        error instanceof Error 
          ? error.message 
          : 'Não foi possível gerar o convite. Por favor, tente novamente.'
      );
    }
  };

  const handlePaymentCycleChange = (cycle: 'weekly' | 'monthly') => {
    console.log('Changing payment cycle to:', cycle);
    setEditedPaymentCycle(cycle);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Grupo não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações do Grupo</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Grupo</Text>
          <TextInput
            style={styles.input}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Nome do grupo"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder="Descrição do grupo"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valor da Penalidade (R$)</Text>
          <TextInput
            style={styles.input}
            value={editedPenaltyAmount}
            onChangeText={setEditedPenaltyAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ciclo de Pagamento</Text>
          <View style={styles.cycleButtons}>
            <TouchableOpacity
              style={[
                styles.cycleButton,
                editedPaymentCycle === 'weekly' && styles.cycleButtonActive,
              ]}
              onPress={() => handlePaymentCycleChange('weekly')}
            >
              <Text style={[
                styles.cycleButtonText,
                editedPaymentCycle === 'weekly' && styles.cycleButtonTextActive,
              ]}>Semanal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cycleButton,
                editedPaymentCycle === 'monthly' && styles.cycleButtonActive,
              ]}
              onPress={() => handlePaymentCycleChange('monthly')}
            >
              <Text style={[
                styles.cycleButtonText,
                editedPaymentCycle === 'monthly' && styles.cycleButtonTextActive,
              ]}>Mensal</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Salvar Configurações"
          onPress={handleSaveSettings}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membros</Text>
          <Button
            title="Convidar"
            onPress={handleGenerateInvite}
            style={[styles.inviteButton, { paddingVertical: 6, paddingHorizontal: 12, minHeight: undefined, height: 36 }]}
            textStyle={styles.inviteButtonText}
            icon="account-plus"
          />
        </View>

        {members.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.users.name}</Text>
              {member.role === 'admin' && (
                <Text style={styles.adminBadge}>Admin</Text>
              )}
            </View>
            {member.role !== 'admin' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member.id)}
              >
                <MaterialCommunityIcons name="account-remove" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cycleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cycleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cycleButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  cycleButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  cycleButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#1F2937',
  },
  adminBadge: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFF5F2',
  },
  removeButton: {
    padding: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 