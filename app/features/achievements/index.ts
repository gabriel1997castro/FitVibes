// Achievements logic for FitVibes
import { awardAchievementIfNotExists } from '../../services/achievementsService';
import { AchievementType } from '../../types/achievements';
import { supabase } from '../../services/supabase';

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
      const achievement = {
        user_id: userId,
        group_id: groupId,
        type: AchievementType.Variety,
        title: `Variedade: ${threshold} tipos`,
        description: `Você experimentou ${threshold} tipos diferentes de exercício!`,
      };
      const awarded = await awardAchievementIfNotExists(achievement);
      if (awarded !== false) {
        await sendAchievementNotification(
          userId,
          groupId,
          'Nova Conquista!',
          `Parabéns! Você experimentou ${threshold} tipos de exercício.`
        );
      }
    }
  }
} 