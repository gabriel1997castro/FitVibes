import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityFeedItem, ActivityReaction } from '../services/activitiesFeedService';
import { translateExerciseType } from '../lib/exerciseTranslations';

interface ActivityCardProps {
  activity: ActivityFeedItem;
  onReaction: (reactionType: 'like' | 'fire' | 'clap' | 'heart') => void;
  onPress: () => void;
  currentUserId: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onReaction,
  onPress,
  currentUserId
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#4CAF50';
      case 'invalid': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Válido';
      case 'invalid': return 'Migué';
      case 'pending': return 'Aguardando';
      default: return 'Desconhecido';
    }
  };

  const hasUserReacted = (reactionType: string) => {
    return activity.reactions.some(
      reaction => reaction.user_id === currentUserId && reaction.reaction_type === reactionType
    );
  };

  const getReactionCount = (reactionType: string) => {
    return activity.reactions.filter(reaction => reaction.reaction_type === reactionType).length;
  };

  const getReactionIcon = (reactionType: string) => {
    switch (reactionType) {
      case 'like': return 'thumb-up';
      case 'fire': return 'fire';
      case 'clap': return 'hand-clap';
      case 'heart': return 'heart';
      default: return 'thumb-up';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={{ uri: activity.user_avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{activity.user_name}</Text>
          <View style={styles.groupInfo}>
            <Text style={styles.groupEmoji}>{activity.group_emoji}</Text>
            <Text style={styles.groupName}>{activity.group_name}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
            <Text style={styles.statusText}>{getStatusText(activity.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.activityType}>
          {activity.type === 'exercise' ? '🏃‍♂️ Treino' : '😅 Desculpa'}
        </Text>
        
        {activity.type === 'exercise' && (
          <Text style={styles.activityDetails}>
            {translateExerciseType(activity.exercise_type)} • {activity.duration_minutes} min
          </Text>
        )}
        
        {activity.type === 'excuse' && (
          <Text style={styles.activityDetails}>
            {activity.excuse_category} • {activity.excuse_text}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {new Date(activity.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        
        <View style={styles.reactions}>
          {(['like', 'fire', 'clap', 'heart'] as const).map((reactionType) => (
            <TouchableOpacity
              key={reactionType}
              style={[
                styles.reactionButton,
                hasUserReacted(reactionType) && styles.reactionButtonActive
              ]}
              onPress={() => onReaction(reactionType)}
            >
              <MaterialCommunityIcons
                name={getReactionIcon(reactionType)}
                size={16}
                color={hasUserReacted(reactionType) ? '#FF6B35' : '#666'}
              />
              {getReactionCount(reactionType) > 0 && (
                <Text style={styles.reactionCount}>{getReactionCount(reactionType)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  groupEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  groupName: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginBottom: 12,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  reactionButtonActive: {
    backgroundColor: '#FFE8E0',
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
}); 