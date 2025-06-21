export enum AchievementType {
  Streak = 'streak',
  Variety = 'variety',
  GlobalStreak = 'global_streak',
  GroupStreak = 'group_streak',
  Social = 'social',
  Creativity = 'creativity',
  // Add more types as needed
}

export interface AchievementInput {
  user_id: string;
  group_id?: string; // Optional for global achievements
  type: AchievementType;
  title: string;
  description?: string;
}

export interface Achievement extends AchievementInput {
  id: string;
  earned_at: string;
} 