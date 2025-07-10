-- Migration: Create views for global and group streak rankings

-- View: global_streak_ranking
CREATE OR REPLACE VIEW global_streak_ranking AS
SELECT 
  id AS user_id,
  name,
  email,
  avatar_url,
  global_streak_days
FROM users
WHERE global_streak_days > 0
ORDER BY global_streak_days DESC, name;

-- View: group_streak_ranking
CREATE OR REPLACE VIEW group_streak_ranking AS
SELECT 
  gm.group_id,
  gm.user_id,
  u.name,
  u.email,
  u.avatar_url,
  gm.streak_days
FROM group_members gm
JOIN users u ON u.id = gm.user_id
WHERE gm.streak_days > 0
ORDER BY gm.group_id, gm.streak_days DESC, u.name; 