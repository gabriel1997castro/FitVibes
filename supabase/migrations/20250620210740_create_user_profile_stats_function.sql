-- Migration: Create function to fetch user profile statistics

CREATE OR REPLACE FUNCTION public.get_user_profile_stats(p_user_id UUID)
RETURNS TABLE (
    global_streak_days INTEGER,
    global_streak_record INTEGER,
    total_groups INTEGER,
    total_points INTEGER,
    total_activities INTEGER,
    exercise_distribution JSONB
) AS $$
DECLARE
    exercise_dist JSONB;
BEGIN
    -- Get exercise distribution separately to avoid nested aggregates
    SELECT COALESCE(
        jsonb_object_agg(
            exercise_type, 
            COUNT(exercise_type)
        ),
        '{}'::jsonb
    ) INTO exercise_dist
    FROM activities 
    WHERE user_id = p_user_id 
      AND status = 'valid' 
      AND exercise_type IS NOT NULL
    GROUP BY user_id;

    RETURN QUERY
    SELECT 
        u.global_streak_days,
        u.global_streak_record,
        COUNT(DISTINCT gm.group_id)::INTEGER as total_groups,
        COALESCE(SUM(gm.points), 0)::INTEGER as total_points,
        COUNT(DISTINCT a.id)::INTEGER as total_activities,
        COALESCE(exercise_dist, '{}'::jsonb) as exercise_distribution
    FROM users u
    LEFT JOIN group_members gm ON u.id = gm.user_id
    LEFT JOIN activities a ON u.id = a.user_id AND a.status = 'valid'
    WHERE u.id = p_user_id
    GROUP BY u.id, u.global_streak_days, u.global_streak_record, exercise_dist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats TO authenticated;
