import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { translateExerciseType, translateExcuseCategory } from '../../../lib/exerciseTranslations';

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

type Vote = {
  id: string;
  voter_id: string;
  is_valid: boolean;
  comment_type?: string;
  created_at: string;
  voter: {
    name: string;
    avatar_url?: string;
  };
};

const PREDEFINED_COMMENTS = {
  'good_job': 'Boa, continue assim! 💪',
  'weak_excuse': 'Desculpa esfarrapada! 😅',
  'tomorrow': 'Bora amanhã! 🎯',
  'understand': 'Te entendo, mas não foge! 😉',
  'respect': 'Respeito o esforço! 🙌',
};

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const { activityId, groupId } = useLocalSearchParams<{ activityId: string; groupId: string }>();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Fetch activity details
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .eq('id', activityId)
        .single();

      if (activityError) throw activityError;
      setActivity(activityData);

      // If activity is pending and NOT owned by current user, redirect to voting
      if (activityData.status === 'pending' && activityData.user_id !== user.id) {
        router.replace(`/groups/${activityData.group_id}/vote?activityId=${activityId}`);
        return;
      }

      // Fetch votes for this activity (even if pending)
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(`
          *,
          voter:users (
            name,
            avatar_url
          )
        `)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true });

      if (votesError) throw votesError;
      setVotes(votesData || []);
      console.log('Votes loaded:', votesData);
      console.log('Votes with comments:', votesData?.filter(vote => vote.comment_type));
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da atividade.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'invalid':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Válido';
      case 'invalid':
        return 'Inválido';
      default:
        return 'Pendente';
    }
  };

  const getVoteIcon = (isValid: boolean) => {
    return isValid ? 'check-circle' : 'close-circle';
  };

  const getVoteColor = (isValid: boolean) => {
    return isValid ? '#10B981' : '#EF4444';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Atividade não encontrada</Text>
      </View>
    );
  }

  const statusStyle = getStatusColor(activity.status);
  const validVotes = votes.filter(vote => vote.is_valid).length;
  const totalVotes = votes.length;

  return (
    <ScrollView style={styles.container}>
      {/* Activity Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons
            name={activity.user.avatar_url ? 'account' : 'account-circle'}
            size={40}
            color="#FF6B35"
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{activity.user.name}</Text>
            <Text style={styles.activityDate}>
              {new Date(activity.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {getStatusText(activity.status)}
          </Text>
        </View>
      </View>

      {/* Activity Content */}
      <View style={styles.activityCard}>
        <Text style={styles.activityType}>
          {activity.type === 'exercise' ? 'Exercício' : 'Desculpa'}
        </Text>
        
        {activity.type === 'exercise' && (
          <View style={styles.exerciseDetails}>
            <Text style={styles.exerciseType}>
              {translateExerciseType(activity.exercise_type)}
            </Text>
            <Text style={styles.duration}>
              {activity.duration_minutes} minutos
            </Text>
          </View>
        )}

        {activity.type === 'excuse' && (
          <View style={styles.excuseDetails}>
            <Text style={styles.excuseCategory}>
              {translateExcuseCategory(activity.excuse_category)}
            </Text>
            {activity.excuse_text && (
              <Text style={styles.excuseText}>{activity.excuse_text}</Text>
            )}
          </View>
        )}
      </View>

      {/* Voting Results */}
      <View style={styles.votingSection}>
        <Text style={styles.sectionTitle}>Resultado da Votação</Text>
        
        <View style={styles.voteSummary}>
          <View style={styles.voteCount}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
            <Text style={styles.voteCountText}>{validVotes} válidos</Text>
          </View>
          <View style={styles.voteCount}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
            <Text style={styles.voteCountText}>{totalVotes - validVotes} inválidos</Text>
          </View>
          <View style={styles.voteCount}>
            <MaterialCommunityIcons name="account-group" size={24} color="#6B7280" />
            <Text style={styles.voteCountText}>{totalVotes} total</Text>
          </View>
        </View>

        {votes.length > 0 ? (
          <View style={styles.votesList}>
            <Text style={styles.votesTitle}>Votos individuais:</Text>
            {votes.map((vote) => (
              <View key={vote.id} style={styles.voteItem}>
                <View style={styles.voteHeader}>
                  <MaterialCommunityIcons
                    name={getVoteIcon(vote.is_valid)}
                    size={20}
                    color={getVoteColor(vote.is_valid)}
                  />
                  <Text style={styles.voterName}>{vote.voter.name}</Text>
                  <Text style={styles.voteTime}>
                    {new Date(vote.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                {vote.comment_type && (
                  <Text style={styles.voteComment}>
                    {PREDEFINED_COMMENTS[vote.comment_type as keyof typeof PREDEFINED_COMMENTS]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noVotes}>
            <MaterialCommunityIcons name="vote" size={48} color="#6B7280" />
            <Text style={styles.noVotesText}>Nenhum voto registrado ainda</Text>
          </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  activityCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  exerciseDetails: {
    marginTop: 8,
  },
  exerciseType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  duration: {
    fontSize: 16,
    color: '#6B7280',
  },
  excuseDetails: {
    marginTop: 8,
  },
  excuseCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  excuseText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  votingSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  voteSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  voteCount: {
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  votesList: {
    marginTop: 16,
  },
  votesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  voteItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  voteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voterName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  voteTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  voteComment: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 28,
    fontStyle: 'italic',
  },
  noVotes: {
    alignItems: 'center',
    padding: 20,
  },
  noVotesText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
}); 