import { supabase } from './supabase';
import { AchievementInput } from '../types/achievements';

export async function awardAchievementIfNotExists(input: AchievementInput) {
  // Check if achievement already exists
  const { data: existing, error: checkError } = await supabase
    .from('achievements')
    .select('id')
    .eq('user_id', input.user_id)
    .eq('group_id', input.group_id)
    .eq('type', input.type)
    .eq('title', input.title)
    .maybeSingle();
  if (existing || checkError) return false;
  // Insert new achievement
  await supabase.from('achievements').insert([input]);
  return true;
}

export async function getUserAchievements(userId: string, groupId?: string) {
  console.log('Getting user achievements for user', userId, 'and group', groupId);
  let query = supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);
  if (groupId) query = query.eq('group_id', groupId);
  const { data, error } = await query;
  console.log('Achievements data', data);
  console.log('Achievements error', error);
  if (error) throw error;
  return data;
} 