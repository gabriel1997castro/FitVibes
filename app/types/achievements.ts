export enum AchievementType {
  Streak = 'streak',
  Variety = 'variety',
  // Add more types as needed
}

export interface AchievementInput {
  user_id: string;
  group_id: string;
  type: AchievementType;
  title: string;
  description?: string;
}

export interface Achievement extends AchievementInput {
  id: string;
  earned_at: string;
} 