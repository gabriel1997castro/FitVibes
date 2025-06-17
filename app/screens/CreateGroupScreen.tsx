import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EMOJI_OPTIONS = ['🏋️‍♂️', '🏃‍♂️', '🚴‍♂️', '🏊‍♂️', '🧘‍♂️', '⚽', '🏀', '🎯', '💪', '🔥'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [penaltyAmount, setPenaltyAmount] = useState('1.00');
  const [paymentCycle, setPaymentCycle] = useState<'weekly' | 'monthly'>('weekly');

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o grupo');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          emoji: selectedEmoji,
          penalty_amount: parseFloat(penaltyAmount),
          payment_cycle: paymentCycle,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      Alert.alert(
        'Sucesso',
        'Grupo criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/groups'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Criar Novo Grupo</Text>
        
        <View style={styles.emojiSelector}>
          <Text style={styles.label}>Escolha um emoji para o grupo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  selectedEmoji === emoji && styles.selectedEmoji,
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome do Grupo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Academia da Família"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva o propósito do grupo..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Valor da Penalidade (R$)</Text>
          <TextInput
            style={styles.input}
            value={penaltyAmount}
            onChangeText={(text) => {
              // Only allow numbers and one decimal point
              const regex = /^\d*\.?\d{0,2}$/;
              if (regex.test(text)) {
                setPenaltyAmount(text);
              }
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ciclo de Pagamento</Text>
          <View style={styles.cycleSelector}>
            <TouchableOpacity
              style={[
                styles.cycleOption,
                paymentCycle === 'weekly' && styles.selectedCycle,
              ]}
              onPress={() => setPaymentCycle('weekly')}
            >
              <Text
                style={[
                  styles.cycleText,
                  paymentCycle === 'weekly' && styles.selectedCycleText,
                ]}
              >
                Semanal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cycleOption,
                paymentCycle === 'monthly' && styles.selectedCycle,
              ]}
              onPress={() => setPaymentCycle('monthly')}
            >
              <Text
                style={[
                  styles.cycleText,
                  paymentCycle === 'monthly' && styles.selectedCycleText,
                ]}
              >
                Mensal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.createButtonText}>Criar Grupo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  emojiSelector: {
    marginBottom: 24,
  },
  emojiList: {
    flexDirection: 'row',
    marginTop: 8,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedEmoji: {
    backgroundColor: '#FF6B35',
  },
  emojiText: {
    fontSize: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cycleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  cycleOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedCycle: {
    backgroundColor: '#FF6B35',
  },
  cycleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedCycleText: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 