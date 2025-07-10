import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { supabase } from '../services/supabase';

interface GlobalStreakUser {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  global_streak_days: number;
}

interface GroupInfo {
  id: string;
  name: string;
  emoji: string;
}

interface GroupStreakUser {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  streak_days: number;
}

export default function Ranking() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalRanking, setGlobalRanking] = useState<GlobalStreakUser[]>([]);
  const [groupRankings, setGroupRankings] = useState<Record<string, GroupStreakUser[]>>({});
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchAllRankings();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllRankings().finally(() => setRefreshing(false));
  }, []);

  const fetchAllRankings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }
      setUser(user);
      // 1. Buscar ranking global
      const { data: globalData, error: globalError } = await supabase
        .from('global_streak_ranking')
        .select('*')
        .order('global_streak_days', { ascending: false })
        .limit(20);
      if (globalError) throw globalError;
      setGlobalRanking(globalData || []);
      // 2. Buscar grupos do usuário
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id, groups(name, emoji)')
        .eq('user_id', user.id);
      if (groupsError) throw groupsError;
      const groupList: GroupInfo[] = (userGroups || []).map((g: any) => ({
        id: g.group_id,
        name: g.groups?.name || 'Grupo',
        emoji: g.groups?.emoji || '🏃',
      }));
      setGroups(groupList);
      // 3. Buscar ranking de streak para cada grupo
      const groupRankingsObj: Record<string, GroupStreakUser[]> = {};
      for (const group of groupList) {
        const { data: groupData, error: groupError } = await supabase
          .from('group_streak_ranking')
          .select('*')
          .eq('group_id', group.id)
          .order('streak_days', { ascending: false });
        if (!groupError && groupData) {
          groupRankingsObj[group.id] = groupData;
        } else {
          groupRankingsObj[group.id] = [];
        }
      }
      setGroupRankings(groupRankingsObj);
    } catch (error) {
      console.error('Erro ao buscar rankings:', error);
      Alert.alert('Erro', 'Não foi possível carregar os rankings.');
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (avatar_url?: string) => {
    if (avatar_url) {
      return <Image source={{ uri: avatar_url }} style={styles.avatar} />;
    }
    return <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarInitial}>?</Text></View>;
  };

  const renderGlobalRanking = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ranking Global de Streak</Text>
      {globalRanking.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌍</Text>
          <Text style={styles.emptyText}>Ninguém com streak global ainda</Text>
        </View>
      ) : (
        globalRanking.map((user, idx) => (
          <View key={user.user_id} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <Text style={styles.rankingPosition}>{idx + 1}</Text>
              <View>
                <Text style={styles.rankingName}>{user.name || user.email}</Text>
                <Text style={styles.rankingEmail}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.rankingRight}>
              <Text style={styles.rankingStreak}>🔥 {user.global_streak_days} dias</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderGroupRankings = () => (
    <>
      {groups.map(group => (
        <View key={group.id} style={styles.section}>
          <Text style={styles.sectionTitle}>Ranking no grupo {group.emoji} {group.name}</Text>
          {(!groupRankings[group.id] || groupRankings[group.id].length === 0) ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏃</Text>
              <Text style={styles.emptyText}>Ninguém com streak neste grupo ainda</Text>
            </View>
          ) : (
            groupRankings[group.id].map((user, idx) => (
              <View key={user.user_id} style={styles.rankingItem}>
                <View style={styles.rankingLeft}>
                  <Text style={styles.rankingPosition}>{idx + 1}</Text>
                  <View>
                    <Text style={styles.rankingName}>{user.name || user.email}</Text>
                    <Text style={styles.rankingEmail}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.rankingRight}>
                  <Text style={styles.rankingStreak}>🔥 {user.streak_days} dias</Text>
                </View>
              </View>
            ))
          )}
        </View>
      ))}
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando rankings...</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ranking</Text>
      </View>
      {renderGlobalRanking()}
      {renderGroupRankings()}
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
    justifyContent: 'center',
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
  rankingPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    width: 28,
    textAlign: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rankingEmail: {
    fontSize: 12,
    color: '#888',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingStreak: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
}); 