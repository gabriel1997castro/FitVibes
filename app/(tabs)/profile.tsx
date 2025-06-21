import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { getUserAchievements } from '../services/achievementsService';
import { Achievement } from '../types/achievements';
import { translateExerciseType } from '../lib/exerciseTranslations';

interface UserStats {
  global_streak_days: number;
  global_streak_record: number;
  total_groups: number;
  total_points: number;
  total_activities: number;
  exercise_distribution: { type: string; count: number }[];
}

interface GroupRanking {
  group_id: string;
  group_name: string;
  group_emoji: string;
  position: number;
  points: number;
  streak_days: number;
}

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [groupRankings, setGroupRankings] = useState<GroupRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProfileData().finally(() => setRefreshing(false));
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setUser(user);

      // Fetch user stats, achievements, and group rankings
      const [userStatsData, achievementsData, groupRankingsData] = await Promise.all([
        fetchUserStats(user.id),
        getUserAchievements(user.id),
        fetchGroupRankings(user.id),
      ]);

      setUserStats(userStatsData);
      setAchievements(achievementsData);
      setGroupRankings(groupRankingsData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string): Promise<UserStats> => {
    // Use the new SQL function for better performance
    const { data, error } = await supabase.rpc('get_user_profile_stats', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        global_streak_days: 0,
        global_streak_record: 0,
        total_groups: 0,
        total_points: 0,
        total_activities: 0,
        exercise_distribution: [],
      };
    }

    const stats = data?.[0];
    if (!stats) {
      return {
        global_streak_days: 0,
        global_streak_record: 0,
        total_groups: 0,
        total_points: 0,
        total_activities: 0,
        exercise_distribution: [],
      };
    }

    // Convert JSONB exercise distribution to array format
    const exerciseDistribution = Object.entries(stats.exercise_distribution || {}).map(([type, count]) => ({
      type,
      count: count as number
    }));

    return {
      global_streak_days: stats.global_streak_days || 0,
      global_streak_record: stats.global_streak_record || 0,
      total_groups: stats.total_groups || 0,
      total_points: stats.total_points || 0,
      total_activities: stats.total_activities || 0,
      exercise_distribution: exerciseDistribution,
    };
  };

  const fetchGroupRankings = async (userId: string): Promise<GroupRanking[]> => {
    const { data } = await supabase
      .from('group_members')
      .select(`
        group_id,
        points,
        streak_days,
        groups (
          name,
          emoji
        )
      `)
      .eq('user_id', userId);

    return data?.map(gm => ({
      group_id: gm.group_id,
      group_name: (gm.groups as any)?.name || 'Unknown',
      group_emoji: (gm.groups as any)?.emoji || '🏃',
      position: 1, // This would need a more complex query to get actual position
      points: gm.points || 0,
      streak_days: gm.streak_days || 0,
    })) || [];
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const renderAchievementBadge = (achievement: Achievement) => {
    const isGlobalStreak = achievement.type === 'global_streak';
    const isGroupStreak = achievement.type === 'group_streak';
    const isGlobal = achievement.type === 'global_streak' || !achievement.group_id;
    const isGroup = achievement.group_id && achievement.type !== 'global_streak';
    
    const textColor = isGlobal ? '#fff' : '#333';
    const descColor = isGlobal ? '#fff' : '#666';
    
    return (
      <View key={achievement.id} style={[
        styles.achievementBadge,
        isGlobal && styles.globalAchievementBadge,
        isGroup && styles.groupAchievementBadge
      ]}>
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementEmoji}>
            {isGlobalStreak ? '🌍' : isGroupStreak ? '🔥' : isGlobal ? '🏆' : '⭐'}
          </Text>
          {isGlobal && (
            <View style={styles.globalBadge}>
              <Text style={styles.globalBadgeText}>GLOBAL</Text>
            </View>
          )}
        </View>
        <Text style={[styles.achievementTitle, { color: textColor }]}>{achievement.title}</Text>
        <Text style={[styles.achievementDesc, { color: descColor }]}>{achievement.description}</Text>
        {isGroup && (
          <Text style={styles.groupName}>
            {groupRankings.find(r => r.group_id === achievement.group_id)?.group_name || 'Grupo'}
          </Text>
        )}
        <Text style={[styles.achievementDate, { color: descColor }]}>
          {new Date(achievement.earned_at).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderExerciseDistribution = () => {
    if (!userStats?.exercise_distribution.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipos de Exercício</Text>
        <View style={styles.exerciseGrid}>
          {userStats.exercise_distribution.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <Text style={styles.exerciseType}>{translateExerciseType(exercise.type)}</Text>
              <Text style={styles.exerciseCount}>{exercise.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderGroupRankings = () => {
    if (!groupRankings.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ranking nos Grupos</Text>
        {groupRankings.map((ranking, index) => (
          <View key={ranking.group_id} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <Text style={styles.rankingEmoji}>{ranking.group_emoji}</Text>
              <Text style={styles.rankingName}>{ranking.group_name}</Text>
            </View>
            <View style={styles.rankingRight}>
              <Text style={styles.rankingPoints}>{ranking.points} pts</Text>
              <Text style={styles.rankingStreak}>🔥 {ranking.streak_days} dias</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B35']}
          tintColor="#FF6B35"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user?.email}</Text>
      </View>

      {/* Global Streak */}
      {userStats && (
        <View style={styles.streakSection}>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakTitle}>Streak Global</Text>
            <Text style={styles.streakDays}>{userStats.global_streak_days} dias seguidos</Text>
            <Text style={styles.streakRecord}>Recorde: {userStats.global_streak_record} dias</Text>
          </View>
        </View>
      )}

      {/* Statistics */}
      {userStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.total_groups}</Text>
              <Text style={styles.statLabel}>Grupos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.total_points}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.total_activities}</Text>
              <Text style={styles.statLabel}>Atividades</Text>
            </View>
          </View>
        </View>
      )}

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conquistas</Text>
        {achievements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyText}>Nenhuma conquista ainda</Text>
            <Text style={styles.emptySubtext}>Continue treinando para desbloquear conquistas!</Text>
          </View>
        ) : (
          <View style={styles.achievementsGrid}>
            {achievements.map(renderAchievementBadge)}
          </View>
        )}
      </View>

      {/* Exercise Distribution */}
      {renderExerciseDistribution()}

      {/* Group Rankings */}
      {renderGroupRankings()}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FF6B35',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  streakSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streakCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  streakDays: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  streakRecord: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  globalAchievementBadge: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  groupAchievementBadge: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  globalBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  globalBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
  },
  achievementTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
    opacity: 0.9,
  },
  groupName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDate: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  exerciseType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 2,
  },
  rankingStreak: {
    fontSize: 12,
    color: '#666',
  },
  bottomSpacing: {
    height: 40,
  },
}); 