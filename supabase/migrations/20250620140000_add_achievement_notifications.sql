-- Migration: Add achievement notifications to streak triggers

-- 1. Create function to handle achievement notifications
CREATE OR REPLACE FUNCTION public.handle_achievement_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for the new achievement
    INSERT INTO public.notifications (
        user_id,
        group_id,
        type,
        title,
        body,
        data
    ) VALUES (
        NEW.user_id,
        NEW.group_id,
        'achievement',
        'Nova Conquista!',
        NEW.description,
        jsonb_build_object(
            'achievement_id', NEW.id,
            'achievement_type', NEW.type,
            'achievement_title', NEW.title
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for achievement notifications
DROP TRIGGER IF EXISTS trigger_achievement_notification ON achievements;
CREATE TRIGGER trigger_achievement_notification
    AFTER INSERT ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_achievement_notification();

-- 3. Update the global streak function to include notifications
CREATE OR REPLACE FUNCTION public.update_global_streak_on_valid_activity()
RETURNS TRIGGER AS $$
DECLARE
    last_activity_date DATE;
    new_global_streak INTEGER;
    thresholds INTEGER[] := ARRAY[1, 7, 14, 30, 60, 100];
    t INTEGER;
    achievement_exists INTEGER;
    new_achievement_id UUID;
BEGIN
    -- Only run if status is being set to 'valid' and it wasn't valid before
    IF NEW.status = 'valid' AND (OLD.status IS DISTINCT FROM 'valid') THEN
        -- Check if user already has a valid activity for today in any group
        SELECT MAX(date) INTO last_activity_date
        FROM activities
        WHERE user_id = NEW.user_id
          AND status = 'valid'
          AND date < NEW.date;

        -- If last activity was yesterday, increment global streak, else reset to 1
        IF last_activity_date = NEW.date - INTERVAL '1 day' THEN
            UPDATE users
            SET global_streak_days = global_streak_days + 1,
                global_streak_record = GREATEST(global_streak_record, global_streak_days + 1)
            WHERE id = NEW.user_id;
        ELSE
            UPDATE users
            SET global_streak_days = 1,
                global_streak_record = GREATEST(global_streak_record, 1)
            WHERE id = NEW.user_id;
        END IF;

        -- Get the new global streak value
        SELECT global_streak_days INTO new_global_streak FROM users WHERE id = NEW.user_id;

        -- Check thresholds and insert global streak achievement if needed
        FOREACH t IN ARRAY thresholds LOOP
            IF new_global_streak = t THEN
                -- Check if global streak achievement already exists
                SELECT COUNT(*) INTO achievement_exists FROM achievements
                WHERE user_id = NEW.user_id AND type = 'global_streak' AND title = ('Global Streak: ' || t || ' days');
                IF achievement_exists = 0 THEN
                    INSERT INTO achievements (user_id, group_id, type, title, description)
                    VALUES (
                        NEW.user_id,
                        NULL, -- Global achievements don't belong to a specific group
                        'global_streak',
                        'Global Streak: ' || t || ' days',
                        'Você treinou ' || t || ' dias seguidos em qualquer grupo!'
                    )
                    RETURNING id INTO new_achievement_id;

                    -- Create notification for global achievement
                    INSERT INTO public.notifications (
                        user_id,
                        group_id,
                        type,
                        title,
                        body,
                        data
                    ) VALUES (
                        NEW.user_id,
                        NULL,
                        'achievement',
                        'Nova Conquista Global!',
                        'Você treinou ' || t || ' dias seguidos em qualquer grupo!',
                        jsonb_build_object(
                            'achievement_type', 'global_streak',
                            'achievement_title', 'Global Streak: ' || t || ' days',
                            'streak_days', t
                        )
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the group streak function to include notifications
CREATE OR REPLACE FUNCTION public.update_streak_days_on_valid_activity()
RETURNS TRIGGER AS $$
DECLARE
    last_activity_date DATE;
    new_streak INTEGER;
    thresholds INTEGER[] := ARRAY[1, 7, 14, 30, 60, 100];
    t INTEGER;
    achievement_exists INTEGER;
    group_name TEXT;
BEGIN
    -- Only run if status is being set to 'valid' and it wasn't valid before
    IF NEW.status = 'valid' AND (OLD.status IS DISTINCT FROM 'valid') THEN
        -- Get the last activity date for this user/group before today
        SELECT MAX(date) INTO last_activity_date
        FROM activities
        WHERE user_id = NEW.user_id
          AND group_id = NEW.group_id
          AND status = 'valid'
          AND date < NEW.date;

        -- If last activity was yesterday, increment streak, else reset to 1
        IF last_activity_date = NEW.date - INTERVAL '1 day' THEN
            UPDATE group_members
            SET streak_days = streak_days + 1
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
        ELSE
            UPDATE group_members
            SET streak_days = 1
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
        END IF;

        -- Get the new streak value
        SELECT streak_days INTO new_streak FROM group_members WHERE user_id = NEW.user_id AND group_id = NEW.group_id;

        -- Get group name for notification
        SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;

        -- Check thresholds and insert group streak achievement if needed
        FOREACH t IN ARRAY thresholds LOOP
            IF new_streak = t THEN
                -- Check if group streak achievement already exists
                SELECT COUNT(*) INTO achievement_exists FROM achievements
                WHERE user_id = NEW.user_id AND group_id = NEW.group_id AND type = 'group_streak' AND title = ('Group Streak: ' || t || ' days');
                IF achievement_exists = 0 THEN
                    INSERT INTO achievements (user_id, group_id, type, title, description)
                    VALUES (
                        NEW.user_id,
                        NEW.group_id,
                        'group_streak',
                        'Group Streak: ' || t || ' days',
                        'Você treinou ' || t || ' dias seguidos no grupo ' || COALESCE(group_name, '') || '!'
                    );

                    -- Create notification for group achievement
                    INSERT INTO public.notifications (
                        user_id,
                        group_id,
                        type,
                        title,
                        body,
                        data
                    ) VALUES (
                        NEW.user_id,
                        NEW.group_id,
                        'achievement',
                        'Nova Conquista no Grupo!',
                        'Você treinou ' || t || ' dias seguidos no grupo ' || COALESCE(group_name, '') || '!',
                        jsonb_build_object(
                            'achievement_type', 'group_streak',
                            'achievement_title', 'Group Streak: ' || t || ' days',
                            'streak_days', t,
                            'group_name', group_name
                        )
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add RLS policy for system to insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. Grant permissions for notifications
GRANT INSERT ON public.notifications TO authenticated; 