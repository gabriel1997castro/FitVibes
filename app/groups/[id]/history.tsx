import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { PaymentHistoryService, PaymentHistoryItem } from '../../services/paymentHistoryService';
import { translateExcuseCategory } from '../../lib/exerciseTranslations';

export default function GroupHistoryScreen() {
  console.log('GroupHistoryScreen mounted');
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);

  useEffect(() => {

    fetchHistory();
  }, [id]);

  const fetchHistory = async () => {
    console.log('fetchHistory called, id:', id);
    setLoading(true);
    try {
      if (!id) {
        console.log('No id, returning');
        return;
      }
      const data = await PaymentHistoryService.getHistory({ groupId: id as string });
      setHistory(data);
    } catch (e) {
      console.log('Error in fetchHistory:', e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="file-document-outline" size={28} color="#FF6B35" style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Histórico de Penalidades</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            // Traduzir categoria se reason for 'categoria — texto'
            let reasonText = item.reason;
            if (item.reason && item.reason.includes(' — ')) {
              const [category, ...rest] = item.reason.split(' — ');
              const translatedCategory = translateExcuseCategory(category);
              reasonText = rest.length > 0 ? `${translatedCategory} — ${rest.join(' — ')}` : translatedCategory;
            }
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={styles.cardDate}>{item.created_at ? item.created_at.split('T')[0].split('-').reverse().join('/') : ''}</Text>
                  <Text style={styles.cardGroup}>
                    {item.group?.emoji} {item.group?.name}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <MaterialCommunityIcons name="account-arrow-right" size={18} color="#FF6B35" style={{ marginRight: 4 }} />
                  <Text style={styles.cardNames}>{item.from_user?.name} ➡️ {item.to_user?.name}</Text>
                </View>
                <View style={styles.cardRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.cardReason}>{reasonText}</Text>
                </View>
                <View style={styles.cardRow}>
                  <MaterialCommunityIcons name="currency-brl" size={18} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.cardAmount}>R$ {item.amount.toFixed(2)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma penalidade encontrada.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFF5F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE5D0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  cardGroup: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  cardNames: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  cardReason: {
    fontSize: 15,
    color: '#DC2626',
  },
  cardAmount: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
}); 