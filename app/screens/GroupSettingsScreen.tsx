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
import { supabase } from '../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Group = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  penalty_amount: number;
  payment_cycle: 'weekly' | 'monthly';
  created_by: string;
};

type Member = {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  name: string;
  avatar_url: string | null;
};

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPenaltyAmount, setNewPenaltyAmount] = useState('');

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  const fetchGroupData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Fetch group data
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      setNewName(groupData.name);
      setNewDescription(groupData.description || '');
      setNewPenaltyAmount(groupData.penalty_amount.toString());

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          users:user_id (
            name,
            avatar_url
          )
        `)
        .eq('group_id', id);

      if (membersError) throw membersError;

      const formattedMembers = membersData.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        name: member.users.name,
        avatar_url: member.users.avatar_url,
      }));

      setMembers(formattedMembers);

      // Check if current user is admin
      const currentMember = formattedMembers.find(m => m.user_id === user.id);
      setIsAdmin(currentMember?.role === 'admin');

    } catch (error) {
      console.error('Error fetching group data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do grupo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!group) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: newName.trim(),
          description: newDescription.trim() || null,
          penalty_amount: parseFloat(newPenaltyAmount),
        })
        .eq('id', group.id);

      if (error) throw error;

      setGroup(prev => prev ? {
        ...prev,
        name: newName.trim(),
        description: newDescription.trim() || null,
        penalty_amount: parseFloat(newPenaltyAmount),
      } : null);

      setEditingName(false);
      setEditingDescription(false);
      Alert.alert('Sucesso', 'Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating group settings:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Remover Membro',
      'Tem certeza que deseja remover este membro do grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('id', memberId);

              if (error) throw error;

              setMembers(prev => prev.filter(m => m.id !== memberId));
              Alert.alert('Sucesso', 'Membro removido com sucesso!');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Erro', 'Não foi possível remover o membro.');
            }
          },
        },
      ]
    );
  };

  const handleGenerateInvite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: invite, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: id,
          invited_by: user.id,
          invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      const inviteLink = `https://fitvibes.app/join/${invite.invite_code}`;
      await Share.share({
        message: `Entre no meu grupo ${group?.name} no FitVibes! Use este link: ${inviteLink}`,
      });
    } catch (error) {
      console.error('Error generating invite:', error);
      Alert.alert('Erro', 'Não foi possível gerar o convite.');
    }
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
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Grupo</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Nome do Grupo</Text>
            {editingName ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nome do grupo"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveSettings}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="check" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.viewContainer}>
                <Text style={styles.value}>{group.name}</Text>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditingName(true)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            {editingDescription ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Descrição do grupo"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveSettings}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="check" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.viewContainer}>
                <Text style={styles.value}>
                  {group.description || 'Sem descrição'}
                </Text>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditingDescription(true)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor da Penalidade</Text>
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={newPenaltyAmount}
                onChangeText={(text) => {
                  const regex = /^\d*\.?\d{0,2}$/;
                  if (regex.test(text)) {
                    setNewPenaltyAmount(text);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#999"
                editable={isAdmin}
              />
              {isAdmin && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveSettings}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="check" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ciclo de Pagamento</Text>
            <Text style={styles.value}>
              {group.payment_cycle === 'weekly' ? 'Semanal' : 'Mensal'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membros</Text>
          {members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>
                  {member.role === 'admin' ? 'Administrador' : 'Membro'}
                </Text>
              </View>
              {isAdmin && member.role !== 'admin' && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(member.id)}
                >
                  <MaterialCommunityIcons name="account-remove" size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Convidar Membros</Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleGenerateInvite}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.inviteButtonText}>Gerar Link de Convite</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAdmin && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Excluir Grupo',
                'Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const { error } = await supabase
                          .from('groups')
                          .delete()
                          .eq('id', id);

                        if (error) throw error;

                        router.replace('/groups');
                      } catch (error) {
                        console.error('Error deleting group:', error);
                        Alert.alert('Erro', 'Não foi possível excluir o grupo.');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="delete" size={24} color="#EF4444" style={styles.buttonIcon} />
            <Text style={styles.deleteButtonText}>Excluir Grupo</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 18,
    color: '#EF4444',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#6B7280',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
  inviteButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
}); 