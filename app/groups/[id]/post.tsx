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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { checkAndAwardStreakAchievements, checkAndAwardVarietyAchievements, checkAndAwardImmediateAchievements, updateGlobalStreakOnPost } from '../../features/achievements';
import Button from '../../components/Button';

const EXERCISE_TYPES = [
  { id: 'walking', name: 'Caminhada', icon: 'walk' as const },
  { id: 'running', name: 'Corrida', icon: 'run' as const },
  { id: 'cycling', name: 'Ciclismo', icon: 'bike' as const },
  { id: 'swimming', name: 'Natação', icon: 'swim' as const },
  { id: 'gym', name: 'Academia', icon: 'weight-lifter' as const },
  { id: 'yoga', name: 'Yoga', icon: 'yoga' as const },
  { id: 'other', name: 'Outro', icon: 'dumbbell' as const },
];

const EXCUSE_CATEGORIES = [
  { id: 'medical', name: 'Atestado médico', icon: 'medical-bag' as const },
  { id: 'travel', name: 'Viagem', icon: 'airplane' as const },
  { id: 'event', name: 'Evento importante', icon: 'calendar-star' as const },
  { id: 'tired', name: 'Cansaço', icon: 'sleep' as const },
  { id: 'other', name: 'Outro', icon: 'dots-horizontal' as const },
];

const AUTO_EXCUSE_TEXT = "Hoje não treinei porque fui muito migué! 😅";

interface UserGroup {
  group_id: string;
  group_name: string;
  group_emoji: string;
  theme_color: string;
  is_member: boolean;
}

export default function PostActivityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'exercise' | 'excuse' | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [selectedExcuse, setSelectedExcuse] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState('');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([id as string]); // Current group is pre-selected
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [tempSelectedGroups, setTempSelectedGroups] = useState<string[]>([id as string]);

  // Fetch user's groups on component mount
  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_groups_for_posting', {
        p_user_id: user.id
      });

      if (error) throw error;
      setUserGroups(data || []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const openGroupModal = () => {
    setTempSelectedGroups([...selectedGroups]);
    setShowGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
  };

  const confirmGroupSelection = () => {
    setSelectedGroups([...tempSelectedGroups]);
    setShowGroupModal(false);
  };

  const toggleGroupInModal = (groupId: string) => {
    setTempSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const removeGroupFromSelection = (groupId: string) => {
    if (selectedGroups.length > 1) {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const selectAllGroups = () => {
    setTempSelectedGroups(userGroups.map(group => group.group_id));
  };

  const getCurrentGroup = () => {
    return userGroups.find(group => group.group_id === id);
  };

  const getSelectedGroupsInfo = () => {
    return userGroups.filter(group => selectedGroups.includes(group.group_id));
  };

  const renderGroupChips = () => {
    const selectedGroupsInfo = getSelectedGroupsInfo();
    console.log('Selected groups info:', selectedGroupsInfo); // Debug
    const maxVisible = 3;
    const visibleGroups = selectedGroupsInfo.slice(0, maxVisible);
    const remainingCount = selectedGroupsInfo.length - maxVisible;

    return (
      <View style={styles.chipsContainer}>
        {visibleGroups.map((group) => (
          <View key={group.group_id} style={styles.chip}>
            <Text style={styles.chipEmoji}>{group.group_emoji}</Text>
            <Text style={styles.chipText} numberOfLines={1}>{group.group_name}</Text>
            {selectedGroups.length > 1 && (
              <TouchableOpacity
                onPress={() => removeGroupFromSelection(group.group_id)}
                style={styles.chipRemoveButton}
              >
                <Text style={styles.chipRemoveText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={styles.chipMore}>
            <Text style={styles.chipMoreText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
    );
  };

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

    if (selectedGroups.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um grupo');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Use the new multi-group function
      const { data, error } = await supabase.rpc('create_activity_for_multiple_groups', {
        p_user_id: user.id,
        p_groups: selectedGroups,
        p_type: type,
        p_exercise_type: type === 'exercise' ? selectedExercise : null,
        p_duration_minutes: type === 'exercise' ? parseInt(duration) : null,
        p_excuse_category: type === 'excuse' ? selectedExcuse : null,
        p_excuse_text: type === 'excuse' ? excuseText : null,
        p_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      console.log('Activity created successfully, checking achievements...');

      // Check and award achievements for each group
      for (const groupId of selectedGroups) {
        console.log('Checking achievements for group:', groupId);
        await checkAndAwardImmediateAchievements(user.id, groupId);
        await checkAndAwardStreakAchievements(user.id, groupId);
        await checkAndAwardVarietyAchievements(user.id, groupId);
      }

      // Check global streak achievements (these are created by triggers, but we can verify)
      console.log('Checking global streak achievements...');
      const { data: userData } = await supabase
        .from('users')
        .select('global_streak_days, global_streak_record')
        .eq('id', user.id)
        .single();
      
      console.log('Current global streak:', userData?.global_streak_days);
      console.log('Global streak record:', userData?.global_streak_record);

      // Update global streak
      await updateGlobalStreakOnPost(user.id);

      const groupCount = selectedGroups.length;
      const groupText = groupCount === 1 ? 'grupo' : 'grupos';
      
      Alert.alert(
        'Sucesso',
        `Atividade registrada com sucesso em ${groupCount} ${groupText}!`,
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

  const currentGroup = getCurrentGroup();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Você treinou hoje?</Text>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'exercise' && styles.selectedType]}
            onPress={() => {
              setType('exercise');
            }}
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
            onPress={() => {
              setType('excuse');
            }}
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
              {EXERCISE_TYPES.map((exercise, idx) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseButton,
                    selectedExercise === exercise.id && styles.selectedExercise,
                    idx % 2 === 0 && { marginRight: 12 },
                  ]}
                  onPress={() => {
                    setSelectedExercise(exercise.id);
                  }}
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
              {EXCUSE_CATEGORIES.map((excuse, idx) => (
                <TouchableOpacity
                  key={excuse.id}
                  style={[
                    styles.excuseButton,
                    selectedExcuse === excuse.id && styles.selectedExcuse,
                    idx % 2 === 0 && { marginRight: 12 },
                  ]}
                  onPress={() => {
                    setSelectedExcuse(excuse.id);
                  }}
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

        {/* Clean group selection section */}
        {type && (
          <View style={styles.groupSection}>
            {selectedGroups.length === 1 && (
              (() => {
                const selectedGroupInfo = getSelectedGroupsInfo()[0];
                return selectedGroupInfo ? (
                  <View style={styles.currentGroupCard}>
                    <Text style={styles.groupEmoji}>{selectedGroupInfo.group_emoji}</Text>
                    <Text style={styles.groupName}>{selectedGroupInfo.group_name}</Text>
                  </View>
                ) : null;
              })()
            )}

            <View style={styles.groupActionsContainer}>
              <TouchableOpacity onPress={openGroupModal} style={styles.addGroupsButton}>
                <Text style={styles.addGroupsIcon}>+</Text>
                <Text style={styles.addGroupsText}>Adicionar grupos</Text>
              </TouchableOpacity>
            </View>

            {selectedGroups.length > 1 && (
              <View style={styles.selectedGroupsChips}>
                <Text style={styles.chipsTitle}>Postando para:</Text>
                {renderGroupChips()}
              </View>
            )}
          </View>
        )}

        <Button
          title={'Postar'}
          onPress={handlePost}
          loading={loading}
          disabled={loading}
          style={styles.postButton}
          textStyle={styles.postButtonText}
          icon="send"
        />
      </ScrollView>

      {/* Group Selection Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeGroupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Grupos</Text>
              <TouchableOpacity onPress={closeGroupModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={selectAllGroups} style={styles.selectAllButton}>
              <Text style={styles.selectAllText}>Selecionar todos os grupos</Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalGroupList}>
              {userGroups.map((group) => (
                <TouchableOpacity
                  key={group.group_id}
                  style={[
                    styles.modalGroupItem,
                    tempSelectedGroups.includes(group.group_id) && styles.selectedModalGroup,
                  ]}
                  onPress={() => toggleGroupInModal(group.group_id)}
                >
                  <View style={styles.modalGroupInfo}>
                    <Text style={styles.modalGroupEmoji}>{group.group_emoji}</Text>
                    <Text style={[
                      styles.modalGroupName,
                      tempSelectedGroups.includes(group.group_id) && styles.selectedModalGroupText,
                    ]}>
                      {group.group_name}
                    </Text>
                  </View>
                  <View style={[
                    styles.modalCheckbox,
                    tempSelectedGroups.includes(group.group_id) && styles.modalCheckboxSelected,
                  ]}>
                    {tempSelectedGroups.includes(group.group_id) && (
                      <Text style={styles.modalCheckboxText}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeGroupModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmGroupSelection} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginRight: 12,
  },
  selectedType: {
    backgroundColor: '#FF6B35',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
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
    marginBottom: 24,
  },
  exerciseButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  selectedExercise: {
    backgroundColor: '#FF6B35',
  },
  exerciseText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 8,
  },
  selectedExerciseText: {
    color: '#fff',
  },
  excuseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  excuseButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  selectedExcuse: {
    backgroundColor: '#FF6B35',
  },
  excuseText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 8,
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
  groupSection: {
    marginBottom: 24,
  },
  currentGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  addGroupsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  addGroupsIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginRight: 8,
  },
  addGroupsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  selectedGroupsChips: {
    marginTop: 12,
  },
  chipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
    minWidth: 120,
  },
  chipEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    flexShrink: 1,
  },
  chipRemoveButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  chipRemoveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  chipMore: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  chipMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 12,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  modalGroupList: {
    marginBottom: 12,
    paddingBottom: 16,
  },
  modalGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedModalGroup: {
    backgroundColor: '#FF6B35',
  },
  modalGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  modalGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  modalGroupEmoji: {
    fontSize: 24,
  },
  selectedModalGroupText: {
    color: '#fff',
  },
  modalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCheckboxSelected: {
    backgroundColor: '#FF6B35',
  },
  modalCheckboxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  confirmButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  groupActionsContainer: {
    marginBottom: 12,
  },
}); 