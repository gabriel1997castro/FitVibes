import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../components/Button';

type Group = {
  id: string;
  name: string;
  description: string | null;
  theme_color: string | null;
  emoji: string;
  penalty_amount: number;
  payment_cycle: 'weekly' | 'monthly';
};

export default function GroupListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(user_id)
        `)
        .eq('group_members.user_id', user.id);

      if (error) throw error;

      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos.');
    } finally {
      setLoading(false);
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/groups/${item.id}`)}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupEmoji}>{item.emoji}</Text>
        <Text style={styles.groupName}>{item.name}</Text>
      </View>
      {item.description && (
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.groupFooter}>
        <Text style={styles.penaltyText}>
          Penalidade: R$ {item.penalty_amount.toFixed(2)}
        </Text>
        <Text style={styles.cycleText}>
          Ciclo: {item.payment_cycle === 'weekly' ? 'Semanal' : 'Mensal'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Grupos</Text>
        <View style={styles.headerButtons}>
          <Button
            title="Entrar"
            onPress={() => router.push('/join')}
            style={styles.headerButton}
            textStyle={styles.headerButtonText}
            icon="account-plus"
            variant="link"
          />
          <Button
            title="Criar"
            onPress={() => router.push('/groups/create')}
            style={styles.headerButton}
            textStyle={styles.headerButtonText}
            icon="plus"
            variant="link"
          />
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>Você ainda não tem grupos</Text>
          <Text style={styles.emptySubtext}>
            Crie um grupo para começar a treinar com seus amigos!
          </Text>
          <Button
            title="Criar Primeiro Grupo"
            onPress={() => router.push('/groups/create')}
            style={styles.emptyButton}
            textStyle={styles.emptyButtonText}
          />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  penaltyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cycleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 