import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';

type Balance = {
  id: string;
  group_id: string;
  user_id: string;
  owed_to_user_id: string;
  amount: number;
  cycle_start_date: string;
  cycle_end_date: string;
  status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
  user: {
    name: string;
  };
  owed_to_user: {
    name: string;
  };
};

type BalanceSummary = {
  totalPending: number;
  totalPaid: number;
};

export default function BalanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary>({ totalPending: 0, totalPaid: 0 });
  const [updatingBalance, setUpdatingBalance] = useState<string | null>(null);

  useEffect(() => {
    fetchBalances();
  }, [id]);

  const calculateSummary = (balances: Balance[]) => {
    return balances.reduce((acc, balance) => {
      if (balance.status === 'pending') {
        acc.totalPending += balance.amount;
      } else {
        acc.totalPaid += balance.amount;
      }
      return acc;
    }, { totalPending: 0, totalPaid: 0 });
  };

  const fetchBalances = async () => {
    try {
      console.log('Fetching balances for group:', id);
      const { data, error } = await supabase
        .from('balances')
        .select(`
          *,
          user:users!balances_user_id_fkey (name),
          owed_to_user:users!balances_owed_to_user_id_fkey (name)
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched balances:', data);
      const typedData = (data || []).map(balance => ({
        ...balance,
        status: balance.status as 'pending' | 'paid'
      }));
      setBalances(typedData);
      setSummary(calculateSummary(typedData));
    } catch (error) {
      console.error('Error fetching balances:', error);
      Alert.alert('Erro', 'Não foi possível carregar os saldos.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (balanceId: string) => {
    try {
      setUpdatingBalance(balanceId);
      
      const { error } = await supabase
        .from('balances')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', balanceId);

      if (error) throw error;

      // Update local state
      const updatedBalances = balances.map(balance => 
        balance.id === balanceId 
          ? { ...balance, status: 'paid' as const, updated_at: new Date().toISOString() }
          : balance
      );
      
      setBalances(updatedBalances);
      setSummary(calculateSummary(updatedBalances));

      Alert.alert('Sucesso', 'Pagamento marcado como realizado!');
    } catch (error) {
      console.error('Error marking balance as paid:', error);
      Alert.alert('Erro', 'Não foi possível marcar o pagamento como realizado.');
    } finally {
      setUpdatingBalance(null);
    }
  };

  const confirmMarkAsPaid = (balanceId: string) => {
    Alert.alert(
      'Confirmar Pagamento',
      'Tem certeza que deseja marcar este pagamento como realizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => handleMarkAsPaid(balanceId) }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Pendente</Text>
        <Text style={[styles.summaryValue, styles.pendingValue]}>
          R$ {summary.totalPending.toFixed(2)}
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Pago</Text>
        <Text style={[styles.summaryValue, styles.paidValue]}>
          R$ {summary.totalPaid.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (balances.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Saldos</Text>
        {renderSummary()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum saldo encontrado para este ciclo.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saldos</Text>
      {renderSummary()}
      <FlatList
        data={balances}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.balanceItem,
            item.status === 'paid' && styles.balanceItemPaid
          ]}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceText}>
                {item.user.name} deve R$ {item.amount.toFixed(2)} para {item.owed_to_user.name}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.status === 'paid' ? '#D1FAE5' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: item.status === 'paid' ? '#059669' : '#DC2626' }
                ]}>
                  {item.status === 'paid' ? 'Pago' : 'Pendente'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.dateText}>
              Ciclo: {new Date(item.cycle_start_date).toLocaleDateString()} - {new Date(item.cycle_end_date).toLocaleDateString()}
            </Text>

            {item.status === 'paid' && (
              <Text style={styles.paidDateText}>
                Pago em: {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            )}

            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.markAsPaidButton}
                onPress={() => confirmMarkAsPaid(item.id)}
                disabled={updatingBalance === item.id}
              >
                {updatingBalance === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.markAsPaidButtonText}>Marcar como Pago</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pendingValue: {
    color: '#DC2626',
  },
  paidValue: {
    color: '#059669',
  },
  balanceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceItemPaid: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1FAE5',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paidDateText: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
  },
  markAsPaidButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  markAsPaidButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
}); 