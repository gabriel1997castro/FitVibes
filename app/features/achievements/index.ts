// Achievements logic for FitVibes
import { awardAchievementIfNotExists } from '../../services/achievementsService';
import { AchievementType } from '../../types/achievements';
import { supabase } from '../../services/supabase';
import { formatExerciseTypesList } from '../../lib/exerciseTranslations';

// Example streak thresholds (days)
const STREAK_THRESHOLDS = [1, 14, 30, 60, 100];

// Example variety thresholds (number of exercise types)
const VARIETY_THRESHOLDS = [1, 5, 10];

async function sendAchievementNotification(userId: string, groupId: string, title: string, body: string) {
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      group_id: groupId,
      type: 'achievement',
      title,
      body,
      read: false,
      created_at: new Date().toISOString(),
    },
  ]);
}

export async function checkAndAwardStreakAchievements(userId: string, groupId: string) {
  // Get the user's current streak in this group
  const { data, error } = await supabase
    .from('group_members')
    .select('streak_days')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .single();
  if (error || !data) return;
  const streak = data.streak_days;
  for (const threshold of STREAK_THRESHOLDS) {
    if (streak >= threshold) {
      const achievement = {
        user_id: userId,
        group_id: groupId,
        type: AchievementType.Streak,
        title: `Streak: ${threshold} days`,
        description: `Você treinou ${threshold} dias seguidos!`,
      };
      const awarded = await awardAchievementIfNotExists(achievement);
      if (awarded !== false) {
        await sendAchievementNotification(
          userId,
          groupId,
          'Nova Conquista!',
          `Parabéns! Você atingiu uma sequência de ${threshold} dias.`
        );
      }
    }
  }
}

export async function checkAndAwardVarietyAchievements(userId: string, groupId: string) {
  // Get all unique exercise types for this user in this group
  const { data, error } = await supabase
    .from('activities')
    .select('exercise_type')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('type', 'exercise');
  if (error || !data) return;
  const uniqueTypes = Array.from(new Set(data.map((a: any) => a.exercise_type).filter(Boolean)));
  for (const threshold of VARIETY_THRESHOLDS) {
    if (uniqueTypes.length >= threshold) {
      const typesList = formatExerciseTypesList(uniqueTypes);
      const achievement = {
        user_id: userId,
        group_id: groupId,
        type: AchievementType.Variety,
        title: `Variedade: ${threshold} tipos`,
        description: `Você experimentou ${threshold} tipos diferentes de exercício: ${typesList}!`,
      };
      const awarded = await awardAchievementIfNotExists(achievement);
      if (awarded !== false) {
        await sendAchievementNotification(
          userId,
          groupId,
          'Nova Conquista!',
          `Parabéns! Você experimentou ${threshold} tipos de exercício: ${typesList}.`
        );
      }
    }
  }
}

// Check for achievements that can be awarded immediately after posting
export async function checkAndAwardImmediateAchievements(userId: string, groupId: string) {
  console.log('Checking immediate achievements for user:', userId, 'group:', groupId);
  
  // Check if this is the user's first activity in this group
  const { data: activities, error } = await supabase
    .from('activities')
    .select('id')
    .eq('user_id', userId)
    .eq('group_id', groupId);

  if (error) {
    console.error('Error checking activities:', error);
    return;
  }

  // First activity achievement
  if (activities && activities.length === 1) {
    const achievement = {
      user_id: userId,
      group_id: groupId,
      type: AchievementType.Social,
      title: 'Primeira Atividade',
      description: 'Você postou sua primeira atividade no grupo!',
    };
    const awarded = await awardAchievementIfNotExists(achievement);
    if (awarded) {
      console.log('Awarded first activity achievement');
      await sendAchievementNotification(
        userId,
        groupId,
        'Nova Conquista!',
        'Parabéns! Você postou sua primeira atividade no grupo.'
      );
    }
  }

  // Check for variety achievements (based on all activities, not just valid ones)
  const { data: exerciseTypes } = await supabase
    .from('activities')
    .select('exercise_type')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('type', 'exercise')
    .not('exercise_type', 'is', null);

  if (exerciseTypes) {
    const uniqueTypes = Array.from(new Set(exerciseTypes.map(a => a.exercise_type)));
    console.log('Unique exercise types:', uniqueTypes);

    for (const threshold of VARIETY_THRESHOLDS) {
      if (uniqueTypes.length >= threshold) {
        const typesList = formatExerciseTypesList(uniqueTypes);
        const achievement = {
          user_id: userId,
          group_id: groupId,
          type: AchievementType.Variety,
          title: `Variedade: ${threshold} tipos`,
          description: `Você experimentou ${threshold} tipos diferentes de exercício: ${typesList}!`,
        };
        const awarded = await awardAchievementIfNotExists(achievement);
        if (awarded) {
          console.log(`Awarded variety achievement for ${threshold} types`);
          await sendAchievementNotification(
            userId,
            groupId,
            'Nova Conquista!',
            `Parabéns! Você experimentou ${threshold} tipos de exercício: ${typesList}.`
          );
        }
      }
    }
  }
}

// Update global streak immediately after posting (not waiting for validation)
export async function updateGlobalStreakOnPost(userId: string) {
  console.log('Updating global streak for user:', userId);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if user already has a valid activity for today in any group
  const { data: todayActivities } = await supabase
    .from('activities')
    .select('date')
    .eq('user_id', userId)
    .eq('date', today);

  // If this is the first activity of the day, update global streak
  if (todayActivities && todayActivities.length === 1) {
    // Get the last activity date before today
    const { data: lastActivity } = await supabase
      .from('activities')
      .select('date')
      .eq('user_id', userId)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Update global streak
    if (lastActivity && lastActivity[0]?.date === yesterdayStr) {
      // Increment streak
      const { data: userData } = await supabase
        .from('users')
        .select('global_streak_days, global_streak_record')
        .eq('id', userId)
        .single();

      if (userData) {
        const newStreak = (userData.global_streak_days || 0) + 1;
        const newRecord = Math.max(userData.global_streak_record || 0, newStreak);

        await supabase
          .from('users')
          .update({
            global_streak_days: newStreak,
            global_streak_record: newRecord
          })
          .eq('id', userId);

        console.log('Updated global streak to:', newStreak);

        // Check for global streak achievements
        const thresholds = [1, 7, 14, 30, 60, 100];
        for (const threshold of thresholds) {
          if (newStreak === threshold) {
            const achievement = {
              user_id: userId,
              group_id: null, // Global achievements don't belong to a specific group
              type: AchievementType.GlobalStreak,
              title: `Global Streak: ${threshold} dias`,
              description: `Você treinou ${threshold} dias seguidos em qualquer grupo!`,
            };
            const awarded = await awardAchievementIfNotExists(achievement);
            if (awarded) {
              console.log(`Awarded global streak achievement for ${threshold} days`);
            }
          }
        }
      }
    } else {
      // Reset streak to 1
      const { data: userData } = await supabase
        .from('users')
        .select('global_streak_record')
        .eq('id', userId)
        .single();

      const newRecord = Math.max(userData?.global_streak_record || 0, 1);

      await supabase
        .from('users')
        .update({
          global_streak_days: 1,
          global_streak_record: newRecord
        })
        .eq('id', userId);

      console.log('Reset global streak to 1');
    }
  }
} 