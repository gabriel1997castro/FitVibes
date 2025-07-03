import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityCard } from '../components/ActivityCard';
import { ActivitiesFeedService, ActivityFeedItem } from '../services/activitiesFeedService';
import { supabase } from '../services/supabase';
import Button from '../components/Button';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();
  const [groups, setGroups] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const loadActivities = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setNextCursor(undefined);
      } else if (nextCursor) {
        setLoadingMore(true);
      }

      console.log('Loading activities with params:', { refresh, nextCursor, selectedGroup });

      const result = await ActivitiesFeedService.getFeed(
        refresh ? undefined : nextCursor,
        20,
        selectedGroup
      );

      console.log('Activities loaded:', result.data.length);

      if (refresh) {
        setActivities(result.data);
      } else {
        setActivities(prev => [...prev, ...result.data]);
      }

      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Erro', `Não foi possível carregar as atividades: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [nextCursor, selectedGroup]);

  const loadGroups = useCallback(async () => {
    try {
      const userGroups = await ActivitiesFeedService.getUserGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      };
      getUser();
      loadGroups();
      loadActivities(true);
    }, [])
  );

  const handleReaction = async (activityId: string, reactionType: 'like' | 'fire' | 'clap' | 'heart') => {
    try {
      const activity = activities.find(a => a.id === activityId);
      const hasReacted = activity?.reactions.some(
        r => r.user_id === user?.id && r.reaction_type === reactionType
      );

      console.log('Handling reaction:', { activityId, reactionType, hasReacted, userId: user?.id });

      if (hasReacted) {
        await ActivitiesFeedService.removeReaction(activityId, reactionType);
      } else {
        await ActivitiesFeedService.addReaction(activityId, reactionType);
      }

      // Refresh the specific activity
      const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
          const updatedReactions = hasReacted
            ? activity.reactions.filter(r => !(r.user_id === user?.id && r.reaction_type === reactionType))
            : [...activity.reactions, {
                id: Date.now().toString(),
                activity_id: activityId,
                user_id: user?.id!,
                reaction_type: reactionType,
                created_at: new Date().toISOString()
              }];
          return { ...activity, reactions: updatedReactions };
        }
        return activity;
      });
      setActivities(updatedActivities);
    } catch (error) {
      console.error('Error in handleReaction:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Erro', `Não foi possível reagir à atividade: ${error.message}`);
    }
  };

  const handleActivityPress = (activity: ActivityFeedItem) => {
    router.push(`/groups/${activity.group_id}/activity/${activity.id}`);
  };

  const renderActivity = ({ item }: { item: ActivityFeedItem }) => (
    <ActivityCard
      activity={item}
      onReaction={(reactionType) => handleReaction(item.id, reactionType)}
      onPress={() => handleActivityPress(item)}
      currentUserId={user?.id || ''}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Carregando mais atividades...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {selectedGroup 
          ? 'Este grupo ainda não tem atividades'
          : 'Seus grupos ainda não têm atividades'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Atividades</Text>
        <Button
          title=""
          onPress={() => setShowGroupFilter(true)}
          style={styles.filterButton}
          icon="filter-variant"
          variant="link"
        />
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadActivities(true)} />
        }
        onEndReached={() => {
          if (nextCursor && !loadingMore) {
            loadActivities();
          }
        }}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showGroupFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Grupo</Text>
              <TouchableOpacity onPress={() => setShowGroupFilter(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setSelectedGroup(undefined);
                setShowGroupFilter(false);
                loadActivities(true);
              }}
            >
              <Text style={styles.filterOptionText}>Todos os grupos</Text>
              {!selectedGroup && (
                <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>

            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedGroup(group.id);
                  setShowGroupFilter(false);
                  loadActivities(true);
                }}
              >
                <Text style={styles.filterOptionText}>
                  {group.emoji} {group.name}
                </Text>
                {selectedGroup === group.id && (
                  <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingVertical: 8,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
}); 