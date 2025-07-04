import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { translateExerciseType, translateExcuseCategory } from '../lib/exerciseTranslations';
import Button from '../components/Button';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valid':
      return { backgroundColor: '#D1FAE5', color: '#059669' };
    case 'invalid':
      return { backgroundColor: '#FEE2E2', color: '#DC2626' };
    default: // pending
      return { backgroundColor: '#FEF3C7', color: '#D97706' };
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'valid':
      return 'Válido';
    case 'invalid':
      return 'Inválido';
    default: // pending
      return 'Pendente';
  }
};

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id, refresh } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
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

      // Check if user is admin (we still need this for settings access)
      const { data: userMember, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        setIsAdmin(false);
      } else {
        setIsAdmin(userMember?.role === 'admin');
      }

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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.groupName}>{group?.name}</Text>
        <View style={styles.headerActions}>
          <Button
            title="Saldos"
            onPress={() => router.push(`/groups/${id}/balance`)}
            style={styles.balanceButton}
            textStyle={styles.balanceButtonText}
            icon="cash"
          />
          {isAdmin && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push(`/groups/${id}/settings`)}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Atividades</Text>
                <View style={styles.sectionActions}>
                  <Button
                    title="Votar"
                    onPress={() => router.push(`/groups/${id}/vote`)}
                    style={styles.voteButton}
                    textStyle={styles.voteButtonText}
                  />
                  <Button
                    title="Adicionar"
                    onPress={() => router.push(`/groups/${id}/post`)}
                    style={styles.voteButton}
                    textStyle={styles.voteButtonText}
                    icon="plus"
                  />
                </View>
              </View>
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => router.push(`/groups/${id}/activity/${activity.id}`)}
                >
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityUser}>{activity.user.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      getStatusColor(activity.status)
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(activity.status).color }
                      ]}>
                        {getStatusText(activity.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityType}>
                    {activity.type === 'exercise' ? 'Exercício' : 'Desculpa'}
                  </Text>
                  {activity.type === 'exercise' && (
                    <Text style={styles.activityDetails}>
                      {translateExerciseType(activity.exercise_type)} - {activity.duration_minutes} minutos
                    </Text>
                  )}
                  {activity.type === 'excuse' && (
                    <Text style={styles.activityDetails}>
                      {translateExcuseCategory(activity.excuse_category)}
                    </Text>
                  )}
                  <Text style={styles.activityDate}>
                    {activity.date ? activity.date.split('-').reverse().join('/') : ''}
                  </Text>
                  <View style={styles.activityFooter}>
                    <Text style={styles.tapToView}>Toque para ver detalhes</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      />
    </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  balanceButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityType: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  voteButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomContainer: {
    height: 80,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 24,
    paddingBottom: 12,
  },
  floatingButton: {
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 32,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  tapToView: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 