import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getUserAchievements } from '../services/achievementsService';
import { Achievement } from '../types/achievements';

export default function Profile() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      console.log('Fetching achievements...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      if (user) {
        try {
          const data = await getUserAchievements(user.id);
          console.log('Fetched achievements:', data);
          setAchievements(data || []);
        } catch (e) {
          console.log('Error fetching achievements:', e);
          setAchievements([]);
        }
      } else {
        console.log('No user found, skipping achievements fetch.');
      }
      setLoading(false);
    };
    fetchAchievements();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Perfil</Text>
      <Text style={styles.sectionTitle}>Conquistas</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B35" />
      ) : achievements.length === 0 ? (
        <Text style={styles.noAchievements}>Nenhuma conquista ainda.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {achievements.map((ach) => (
            <View key={ach.id} style={styles.achievementBadge}>
              <Text style={styles.achievementTitle}>{ach.title}</Text>
              <Text style={styles.achievementDesc}>{ach.description}</Text>
              <Text style={styles.achievementDate}>{new Date(ach.earned_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  achievementsScroll: {
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 120,
  },
  achievementBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'center',
  },
  achievementDate: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
    textAlign: 'center',
  },
  noAchievements: {
    color: '#888',
    fontSize: 15,
    marginTop: 16,
  },
}); 