-- Migration: Support for posting activities to multiple groups

-- 1. Create function to post activity to multiple groups
CREATE OR REPLACE FUNCTION public.create_activity_for_multiple_groups(
    p_user_id UUID,
    p_groups UUID[],
    p_type VARCHAR(20),
    p_exercise_type VARCHAR(50) DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_excuse_category VARCHAR(50) DEFAULT NULL,
    p_excuse_text TEXT DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF activities AS $$
DECLARE
    group_id UUID;
    activity_record activities;
BEGIN
    -- Validate input
    IF array_length(p_groups, 1) IS NULL OR array_length(p_groups, 1) = 0 THEN
        RAISE EXCEPTION 'At least one group must be specified';
    END IF;

    -- Check if user is member of all specified groups
    FOREACH group_id IN ARRAY p_groups LOOP
        IF NOT EXISTS (
            SELECT 1 FROM group_members 
            WHERE user_id = p_user_id AND group_id = group_id
        ) THEN
            RAISE EXCEPTION 'User is not a member of group %', group_id;
        END IF;
    END LOOP;

    -- Create activity for each group
    FOREACH group_id IN ARRAY p_groups LOOP
        -- Check if activity already exists for this user/group/date
        IF EXISTS (
            SELECT 1 FROM activities 
            WHERE user_id = p_user_id 
              AND group_id = group_id 
              AND date = p_date
        ) THEN
            RAISE EXCEPTION 'Activity already exists for user % in group % on date %', p_user_id, group_id, p_date;
        END IF;

        -- Insert the activity
        INSERT INTO activities (
            group_id,
            user_id,
            type,
            exercise_type,
            duration_minutes,
            excuse_category,
            excuse_text,
            date,
            status
        ) VALUES (
            group_id,
            p_user_id,
            p_type,
            p_exercise_type,
            p_duration_minutes,
            p_excuse_category,
            p_excuse_text,
            p_date,
            'pending'
        ) RETURNING * INTO activity_record;

        RETURN NEXT activity_record;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to get user's groups for activity posting
CREATE OR REPLACE FUNCTION public.get_user_groups_for_posting(p_user_id UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    group_emoji VARCHAR(10),
    theme_color VARCHAR(7),
    is_member BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as group_id,
        g.name::VARCHAR(255) as group_name,
        g.emoji::VARCHAR(10) as group_emoji,
        g.theme_color::VARCHAR(7) as theme_color,
        true as is_member
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = p_user_id
    ORDER BY g.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to check if user has already posted in any group today
CREATE OR REPLACE FUNCTION public.has_user_posted_today(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM activities 
        WHERE user_id = p_user_id 
          AND date = p_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.create_activity_for_multiple_groups TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_groups_for_posting TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_posted_today TO authenticated; 