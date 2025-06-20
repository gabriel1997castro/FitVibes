-- Migration: Add global streak tracking to users table and update streak triggers

-- 1. Add global streak columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS global_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS global_streak_record INTEGER DEFAULT 0;

-- 2. Create function to update global streak when any activity is marked as valid
CREATE OR REPLACE FUNCTION public.update_global_streak_on_valid_activity()
RETURNS TRIGGER AS $$
DECLARE
    last_activity_date DATE;
    new_global_streak INTEGER;
    thresholds INTEGER[] := ARRAY[1, 7, 14, 30, 60, 100];
    t INTEGER;
    achievement_exists INTEGER;
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
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for global streak updates
DROP TRIGGER IF EXISTS trigger_update_global_streak ON activities;
CREATE TRIGGER trigger_update_global_streak
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_global_streak_on_valid_activity();

-- 4. Update the existing group streak function to also handle group-specific achievements
CREATE OR REPLACE FUNCTION public.update_streak_days_on_valid_activity()
RETURNS TRIGGER AS $$
DECLARE
    last_activity_date DATE;
    new_streak INTEGER;
    thresholds INTEGER[] := ARRAY[1, 7, 14, 30, 60, 100];
    t INTEGER;
    achievement_exists INTEGER;
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
                        'Você treinou ' || t || ' dias seguidos neste grupo!'
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update the existing trigger (it will be recreated with the new function)
DROP TRIGGER IF EXISTS trigger_update_streak_days ON activities;
CREATE TRIGGER trigger_update_streak_days
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_days_on_valid_activity(); 