-- Create activity reactions table
CREATE TABLE activity_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'fire', 'clap', 'heart')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id, reaction_type)
);

-- Create user feed activities view (simplified without auth.uid())
CREATE OR REPLACE VIEW user_feed_activities AS
SELECT 
    a.id,
    a.group_id,
    a.user_id,
    a.type,
    a.exercise_type,
    a.duration_minutes,
    a.excuse_category,
    a.excuse_text,
    a.status,
    a.created_at,
    a.date,
    g.name as group_name,
    g.emoji as group_emoji,
    g.theme_color as group_color,
    u.name as user_name,
    u.avatar_url as user_avatar,
    COUNT(v.id) as vote_count,
    COUNT(CASE WHEN v.is_valid = true THEN 1 END) as valid_votes,
    COUNT(CASE WHEN v.is_valid = false THEN 1 END) as invalid_votes
FROM activities a
JOIN groups g ON a.group_id = g.id
JOIN users u ON a.user_id = u.id
LEFT JOIN votes v ON a.id = v.activity_id
GROUP BY a.id, g.name, g.emoji, g.theme_color, u.name, u.avatar_url
ORDER BY a.created_at DESC;

-- Add performance indexes on tables (not views)
CREATE INDEX idx_activity_reactions_activity_id ON activity_reactions(activity_id);
CREATE INDEX idx_activity_reactions_user_id ON activity_reactions(user_id);

-- Enable RLS on activity_reactions table
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for activity_reactions
CREATE POLICY "Users can manage their own reactions" ON activity_reactions
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view all reactions" ON activity_reactions
FOR SELECT USING (true); 