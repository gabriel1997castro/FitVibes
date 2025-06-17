import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EXERCISE_TYPES = [
  { id: 'walking', name: 'Caminhada', icon: 'walk' },
  { id: 'running', name: 'Corrida', icon: 'run' },
  { id: 'cycling', name: 'Ciclismo', icon: 'bike' },
  { id: 'swimming', name: 'Natação', icon: 'swim' },
  { id: 'gym', name: 'Academia', icon: 'weight-lifter' },
  { id: 'yoga', name: 'Yoga', icon: 'yoga' },
  { id: 'other', name: 'Outro', icon: 'dumbbell' },
];

const EXCUSE_CATEGORIES = [
  { id: 'medical', name: 'Atestado médico', icon: 'medical-bag' },
  { id: 'travel', name: 'Viagem', icon: 'airplane' },
  { id: 'event', name: 'Evento importante', icon: 'calendar-star' },
  { id: 'tired', name: 'Cansaço', icon: 'sleep' },
  { id: 'other', name: 'Outro', icon: 'dots-horizontal' },
];

const AUTO_EXCUSE_TEXT = "Hoje não treinei porque fui muito migué! 😅";

export default function PostActivityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'exercise' | 'excuse' | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [selectedExcuse, setSelectedExcuse] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState('');

  useEffect(() => {
    const checkAndCreateAutoExcuse = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user already has an activity for today
        const { data: existingActivity } = await supabase
          .from('activities')
          .select('id')
          .eq('group_id', id)
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .single();

        if (!existingActivity) {
          // Create auto-excuse
          const { error } = await supabase
            .from('activities')
            .insert({
              group_id: id,
              user_id: user.id,
              type: 'auto_excuse',
              excuse_category: 'other',
              excuse_text: AUTO_EXCUSE_TEXT,
              date: new Date().toISOString().split('T')[0],
              status: 'pending'
            });

          if (error) {
            console.error('Error creating auto-excuse:', error);
          }
        }
      } catch (error) {
        console.error('Error in auto-excuse check:', error);
      }
    };

    // Check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout for midnight check
    const timeoutId = setTimeout(checkAndCreateAutoExcuse, timeUntilMidnight);

    // Also check immediately in case the user opens the app after midnight
    checkAndCreateAutoExcuse();

    return () => clearTimeout(timeoutId);
  }, [id]);

  const handlePost = async () => {
    if (!type) {
      Alert.alert('Erro', 'Selecione se você treinou ou não');
      return;
    }

    if (type === 'exercise' && !selectedExercise) {
      Alert.alert('Erro', 'Selecione o tipo de exercício');
      return;
    }

    if (type === 'exercise' && !duration) {
      Alert.alert('Erro', 'Informe a duração do exercício');
      return;
    }

    if (type === 'excuse' && !selectedExcuse) {
      Alert.alert('Erro', 'Selecione a categoria da desculpa');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('activities')
        .insert({
          group_id: id,
          user_id: user.id,
          type,
          exercise_type: type === 'exercise' ? selectedExercise : null,
          duration_minutes: type === 'exercise' ? parseInt(duration) : null,
          excuse_category: type === 'excuse' ? selectedExcuse : null,
          excuse_text: type === 'excuse' ? excuseText : null,
          date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      Alert.alert(
        'Sucesso',
        'Atividade registrada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error posting activity:', error);
      Alert.alert('Erro', 'Não foi possível registrar a atividade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Você treinou hoje?</Text>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'exercise' && styles.selectedType]}
            onPress={() => setType('exercise')}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={type === 'exercise' ? '#fff' : '#FF6B35'}
            />
            <Text style={[styles.typeText, type === 'exercise' && styles.selectedTypeText]}>
              Sim, treinei!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'excuse' && styles.selectedType]}
            onPress={() => setType('excuse')}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={24}
              color={type === 'excuse' ? '#fff' : '#FF6B35'}
            />
            <Text style={[styles.typeText, type === 'excuse' && styles.selectedTypeText]}>
              Não, não treinei
            </Text>
          </TouchableOpacity>
        </View>

        {type === 'exercise' && (
          <View style={styles.exerciseSection}>
            <Text style={styles.sectionTitle}>Tipo de Exercício</Text>
            <View style={styles.exerciseGrid}>
              {EXERCISE_TYPES.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseButton,
                    selectedExercise === exercise.id && styles.selectedExercise,
                  ]}
                  onPress={() => setSelectedExercise(exercise.id)}
                >
                  <MaterialCommunityIcons
                    name={exercise.icon}
                    size={24}
                    color={selectedExercise === exercise.id ? '#fff' : '#FF6B35'}
                  />
                  <Text
                    style={[
                      styles.exerciseText,
                      selectedExercise === exercise.id && styles.selectedExerciseText,
                    ]}
                  >
                    {exercise.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Duração (minutos)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="Ex: 30"
              keyboardType="numeric"
            />
          </View>
        )}

        {type === 'excuse' && (
          <View style={styles.excuseSection}>
            <Text style={styles.sectionTitle}>Categoria da Desculpa</Text>
            <View style={styles.excuseGrid}>
              {EXCUSE_CATEGORIES.map((excuse) => (
                <TouchableOpacity
                  key={excuse.id}
                  style={[
                    styles.excuseButton,
                    selectedExcuse === excuse.id && styles.selectedExcuse,
                  ]}
                  onPress={() => setSelectedExcuse(excuse.id)}
                >
                  <MaterialCommunityIcons
                    name={excuse.icon}
                    size={24}
                    color={selectedExcuse === excuse.id ? '#fff' : '#FF6B35'}
                  />
                  <Text
                    style={[
                      styles.excuseText,
                      selectedExcuse === excuse.id && styles.selectedExcuseText,
                    ]}
                  >
                    {excuse.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Detalhes (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={excuseText}
              onChangeText={setExcuseText}
              placeholder="Adicione mais detalhes sobre sua desculpa..."
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.postButton, loading && styles.disabledButton]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.postButtonText}>Enviar</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  selectedType: {
    backgroundColor: '#FF6B35',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  selectedTypeText: {
    color: '#fff',
  },
  exerciseSection: {
    marginBottom: 24,
  },
  excuseSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  exerciseButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  selectedExercise: {
    backgroundColor: '#FF6B35',
  },
  exerciseText: {
    fontSize: 14,
    color: '#FF6B35',
  },
  selectedExerciseText: {
    color: '#fff',
  },
  excuseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  excuseButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  selectedExcuse: {
    backgroundColor: '#FF6B35',
  },
  excuseText: {
    fontSize: 14,
    color: '#FF6B35',
  },
  selectedExcuseText: {
    color: '#fff',
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
  postButton: {
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
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 