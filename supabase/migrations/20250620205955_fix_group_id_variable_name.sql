-- Migration: Rename PL/pgSQL variable group_id to gid in create_activity_for_multiple_groups to avoid ambiguity

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
    gid UUID;
    activity_record activities;
BEGIN
    -- Validate input
    IF array_length(p_groups, 1) IS NULL OR array_length(p_groups, 1) = 0 THEN
        RAISE EXCEPTION 'At least one group must be specified';
    END IF;

    -- Check if user is member of all specified groups
    FOREACH gid IN ARRAY p_groups LOOP
        IF NOT EXISTS (
            SELECT 1 FROM group_members 
            WHERE user_id = p_user_id AND group_members.group_id = gid
        ) THEN
            RAISE EXCEPTION 'User is not a member of group %', gid;
        END IF;
    END LOOP;

    -- Create activity for each group
    FOREACH gid IN ARRAY p_groups LOOP
        -- Check if activity already exists for this user/group/date
        IF EXISTS (
            SELECT 1 FROM activities 
            WHERE user_id = p_user_id 
              AND activities.group_id = gid 
              AND date = p_date
        ) THEN
            RAISE EXCEPTION 'Activity already exists for user % in group % on date %', p_user_id, gid, p_date;
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
            gid,
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
