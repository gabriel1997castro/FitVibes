-- Migration: Grant SELECT on streak ranking views to authenticated users

GRANT SELECT ON global_streak_ranking TO authenticated;
GRANT SELECT ON group_streak_ranking TO authenticated; 