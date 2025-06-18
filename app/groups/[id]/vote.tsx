import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PREDEFINED_COMMENTS = [
  { id: 'good_job', text: 'Boa, continue assim! 💪' },
  { id: 'weak_excuse', text: 'Desculpa esfarrapada! 😅' },
  { id: 'tomorrow', text: 'Bora amanhã! 🎯' },
  { id: 'understand', text: 'Te entendo, mas não foge! 😉' },
  { id: 'respect', text: 'Respeito o esforço! 🙌' },
];

type Activity = {
  id: string;
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

export default function VoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [id]);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get today's activities that need voting
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .eq('group_id', id)
        .eq('date', today)
        .eq('status', 'pending')
        .neq('user_id', user.id); // Don't show user's own activities

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Erro', 'Não foi possível carregar as atividades.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (isValid: boolean, commentId?: string) => {
    if (!activities[currentIndex]) return;

    setVoting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user is trying to vote on their own activity
      if (activities[currentIndex].user_id === user.id) {
        Alert.alert('Erro', 'Você não pode votar na sua própria atividade.');
        return;
      }

      // Insert vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          activity_id: activities[currentIndex].id,
          voter_id: user.id,
          is_valid: isValid
        });

      if (voteError) {
        console.error('Error inserting vote:', voteError);
        throw voteError;
      }

      console.log('Vote inserted successfully');

      // Get total number of group members (excluding the activity owner)
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id')
        .eq('group_id', id)
        .neq('user_id', activities[currentIndex].user_id); // Exclude the activity owner

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        throw membersError;
      }

      console.log('Group members (excluding owner):', groupMembers);

      // Get all votes for this activity
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('id, is_valid')
        .eq('activity_id', activities[currentIndex].id);

      if (votesError) {
        console.error('Error fetching votes:', votesError);
        throw votesError;
      }

      console.log('All votes for activity:', votes);

      // Debug: Log votes and activity
      console.log('Activity:', activities[currentIndex].id);
      console.log('Group members (excluding owner):', groupMembers.length);
      console.log('Total votes:', votes.length);
      console.log('Votes:', votes);

      // If all members have voted (except the activity owner), update activity status
      if (votes.length === groupMembers.length) { // Subtract 1 to exclude the activity owner
        // Count valid votes
        const validVotes = votes.filter(vote => vote.is_valid).length;
        console.log('Valid votes count:', validVotes);
        console.log('Total votes count:', votes.length);

        // Update activity status based on majority vote
        const { error: updateError } = await supabase
          .from('activities')
          .update({
            status: validVotes > votes.length / 2 ? 'valid' : 'invalid'
          })
          .eq('id', activities[currentIndex].id);

        if (updateError) {
          console.error('Error updating activity status:', updateError);
          throw updateError;
        }

        console.log('Activity status updated successfully');
      } else {
        console.log('Not enough votes to update status:', {
          votesCount: votes.length,
          requiredVotes: groupMembers.length,
          groupMembersCount: groupMembers.length
        });
      }

      // Move to next activity
      if (currentIndex < activities.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        Alert.alert(
          'Sucesso',
          'Você votou em todas as atividades!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Erro', 'Não foi possível registrar seu voto. Tente novamente.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="check-circle" size={48} color="#6B7280" />
        <Text style={styles.emptyText}>Não há atividades para votar hoje!</Text>
      </View>
    );
  }

  const currentActivity = activities[currentIndex];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} de {activities.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / activities.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.activityCard}>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons
            name={currentActivity.user.avatar_url ? 'account' : 'account-circle'}
            size={40}
            color="#FF6B35"
          />
          <Text style={styles.userName}>{currentActivity.user.name}</Text>
        </View>

        <View style={styles.activityContent}>
          {currentActivity.type === 'exercise' ? (
            <>
              <Text style={styles.activityType}>
                {currentActivity.exercise_type}
              </Text>
              <Text style={styles.activityDuration}>
                {currentActivity.duration_minutes} minutos
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.excuseCategory}>
                {currentActivity.excuse_category}
              </Text>
              {currentActivity.excuse_text && (
                <Text style={styles.excuseText}>{currentActivity.excuse_text}</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.voteButton, styles.validButton]}
            onPress={() => handleVote(true)}
            disabled={voting}
          >
            <MaterialCommunityIcons name="check" size={24} color="#fff" />
            <Text style={styles.voteButtonText}>Válido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.voteButton, styles.invalidButton]}
            onPress={() => handleVote(false)}
            disabled={voting}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
            <Text style={styles.voteButtonText}>Migué</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle}>Comentários:</Text>
          {PREDEFINED_COMMENTS.map((comment) => (
            <TouchableOpacity
              key={comment.id}
              style={styles.commentButton}
              onPress={() => handleVote(true, comment.id)}
              disabled={voting}
            >
              <Text style={styles.commentText}>{comment.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  progressContainer: {
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  activityContent: {
    marginBottom: 24,
  },
  activityType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  activityDuration: {
    fontSize: 16,
    color: '#6B7280',
  },
  excuseCategory: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  excuseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  validButton: {
    backgroundColor: '#10B981',
  },
  invalidButton: {
    backgroundColor: '#EF4444',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentsContainer: {
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  commentButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#1F2937',
  },
}); 