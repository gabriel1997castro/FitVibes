import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importar o conteúdo da tela de histórico
import GroupHistoryScreen from './history';

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
  const [updatingBalance, setUpdatingBalance] = useState<string | null>(null);
  const [cycles, setCycles] = useState<{ start: string, end: string }[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<{ start: string, end: string } | null>(null);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [tab, setTab] = useState<'saldos' | 'historico'>('saldos');

  useEffect(() => {
    fetchCycles();
  }, [id]);

  useEffect(() => {
    if (selectedCycle) fetchBalances(selectedCycle);
  }, [selectedCycle]);

  const fetchCycles = async () => {
    const { data, error } = await supabase
      .from('balances')
      .select('cycle_start_date, cycle_end_date')
      .eq('group_id', id)
      .order('cycle_end_date', { ascending: false });
    if (error) return;
    const uniqueCycles = Array.from(new Set((data || []).map(d => `${d.cycle_start_date}|${d.cycle_end_date}`)))
      .map(str => {
        const [start, end] = str.split('|');
        return { start, end };
      });
    setCycles(uniqueCycles);
    setSelectedCycle(uniqueCycles[0] || null);
  };

  const fetchBalances = async (cycle: { start: string, end: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('balances')
        .select(`*, user:users!balances_user_id_fkey (name), owed_to_user:users!balances_owed_to_user_id_fkey (name)`)
        .eq('group_id', id)
        .eq('cycle_start_date', cycle.start)
        .eq('cycle_end_date', cycle.end)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const typedData = (data || []).map(balance => ({ ...balance, status: balance.status as 'pending' | 'paid' }));
      setBalances(typedData);
    } catch (error) {
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
      setBalances(balances => balances.map(b => b.id === balanceId ? { ...b, status: 'paid', updated_at: new Date().toISOString() } : b));
      Alert.alert('Sucesso', 'Pagamento marcado como realizado!');
    } catch (error) {
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

  // Agrupar por status
  const pendentes = balances.filter(b => b.status === 'pending');
  const quitados = balances.filter(b => b.status === 'paid');

  return (
    <View style={styles.container}>
      {/* Abas */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'saldos' && styles.tabButtonActive]}
          onPress={() => setTab('saldos')}
        >
          <Text style={[styles.tabButtonText, tab === 'saldos' && styles.tabButtonTextActive]}>Saldos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'historico' && styles.tabButtonActive]}
          onPress={() => setTab('historico')}
        >
          <Text style={[styles.tabButtonText, tab === 'historico' && styles.tabButtonTextActive]}>Histórico</Text>
        </TouchableOpacity>
      </View>
      {tab === 'saldos' ? (
        <ScrollView>
          {/* Header do ciclo atual ou selecionado */}
          <Pressable onPress={() => setShowCycleModal(true)} style={styles.cycleHeader}>
            <MaterialCommunityIcons name="reload" size={20} color="#FF6B35" style={{ marginRight: 8 }} />
            <Text style={styles.cycleHeaderText}>
              {selectedCycle ? `Ciclo: ${selectedCycle.start ? selectedCycle.start.split('-').reverse().join('/') : ''} a ${selectedCycle.end ? selectedCycle.end.split('-').reverse().join('/') : ''}` : 'Ciclo'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#FF6B35" style={{ marginLeft: 8 }} />
          </Pressable>
          {/* Modal de seleção de ciclo */}
          <Modal visible={showCycleModal} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setShowCycleModal(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecione o ciclo</Text>
                <FlatList
                  data={cycles}
                  keyExtractor={item => `${item.start}|${item.end}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.cycleOption}
                      onPress={() => {
                        setSelectedCycle(item);
                        setShowCycleModal(false);
                      }}
                    >
                      <Text style={styles.cycleOptionText}>
                        {item.start.split('-').reverse().join('/')} a {item.end.split('-').reverse().join('/')}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Pressable>
          </Modal>
          {/* Saldos pendentes */}
          <Text style={styles.sectionTitle}>💰 Saldos do ciclo</Text>
          {pendentes.length === 0 && quitados.length === 0 && (
            <Text style={styles.emptyText}>Nenhum saldo neste ciclo.</Text>
          )}
          {pendentes.map(item => (
            <View key={item.id} style={styles.balanceItem}>
              <View style={styles.balanceRow}>
                <MaterialCommunityIcons name="cash" size={24} color="#FF6B35" style={{ marginRight: 8 }} />
                <Text style={styles.balanceText}>
                  {item.user.name} deve <Text style={{ fontWeight: 'bold' }}>R$ {item.amount.toFixed(2)}</Text> para {item.owed_to_user.name}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.statusPendente}>Aguardando pagamento</Text>
              </View>
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
            </View>
          ))}
          {/* Saldos quitados recentemente */}
          <Text style={styles.sectionTitle}>✅ Saldos quitados neste ciclo</Text>
          {quitados.length === 0 && (
            <Text style={styles.emptyText}>Nenhum saldo quitado neste ciclo.</Text>
          )}
          {quitados.map(item => (
            <View key={item.id} style={[styles.balanceItem, styles.balanceItemPaid]}>
              <View style={styles.balanceRow}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.balanceText}>
                  {item.user.name} quitou <Text style={{ fontWeight: 'bold' }}>R$ {item.amount.toFixed(2)}</Text> para {item.owed_to_user.name}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons name="check" size={18} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.statusPago}>Pago em {item.updated_at ? item.updated_at.split('T')[0].split('-').reverse().join('/') : ''}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <GroupHistoryScreen />
      )}
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
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF5F2',
    padding: 12,
    borderRadius: 8,
  },
  cycleHeaderText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPendente: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPago: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
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
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FF6B35',
  },
  tabButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  cycleOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cycleOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
}); 