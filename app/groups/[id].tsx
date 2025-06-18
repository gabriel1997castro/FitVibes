import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

type Activity = {
  id: string;
  group_id: string;
  user_id: string;
  type: 'exercise' | 'excuse' | 'auto_excuse';
  exercise_type?: string;
  duration_minutes?: number;
  excuse_category?: string;
  excuse_text?: string;
  date: string;
  status: 'pending' | 'valid' | 'invalid';
  user: {
    name: string;
    avatar_url?: string;
  };
};

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id, refresh } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
    }, [id, refresh])
  );

  const fetchGroupDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

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
      setMembers(membersData);

      // Check if user is admin
      const userMember = membersData.find(m => m.user_id === user.id);
      setIsAdmin(userMember?.role === 'admin');

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .eq('group_id', id)
        .order('date', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching group details:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do grupo.');
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupEmoji}>{group.emoji}</Text>
          <Text style={styles.groupName}>{group.name}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push(`/groups/${id}/settings`)}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => router.push(`/groups/${id}/vote`)}
        >
          <MaterialCommunityIcons name="vote" size={24} color="#fff" />
          <Text style={styles.voteButtonText}>Votar</Text>
        </TouchableOpacity>
      </View>

      {group.description && (
        <Text style={styles.description}>{group.description}</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membros</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.users.name}</Text>
              {member.role === 'admin' && (
                <Text style={styles.adminBadge}>Admin</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atividades</Text>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push(`/groups/${id}/activities/create`)}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma atividade registrada</Text>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityItem}
              onPress={() => router.push(`/groups/${id}/activities/${activity.id}`)}
            >
              <View style={styles.activityInfo}>
                <View style={styles.activityHeader}>
                  <Text style={styles.userName}>{activity.user.name}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString()}
                  </Text>
                </View>
                {activity.type === 'exercise' ? (
                  <View>
                    <Text style={styles.activityType}>
                      {activity.exercise_type}
                    </Text>
                    <Text style={styles.activityDuration}>
                      {activity.duration_minutes} minutos
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.excuseCategory}>
                      {activity.excuse_category}
                    </Text>
                    {activity.excuse_text && (
                      <Text style={styles.excuseText}>{activity.excuse_text}</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    activity.status === 'valid' ? '#10B981' : 
                    activity.status === 'invalid' ? '#EF4444' : 
                    '#F59E0B'
                }
              ]}>
                <Text style={styles.statusText}>
                  {activity.status === 'valid' ? 'Válido' : 
                   activity.status === 'invalid' ? 'Inválido' : 
                   'Pendente'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/groups/${id}/post`)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsButton: {
    padding: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  addButton: {
    backgroundColor: '#FF6B35',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityType: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  excuseCategory: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  excuseText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 