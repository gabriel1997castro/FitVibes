-- Migration: Update streak_days in group_members and create achievements when an activity is marked as valid for today

-- 1. Create a function to update streak_days and insert achievements
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

        -- Check thresholds and insert achievement if needed
        FOREACH t IN ARRAY thresholds LOOP
            IF new_streak = t THEN
                -- Check if achievement already exists
                SELECT COUNT(*) INTO achievement_exists FROM achievements
                WHERE user_id = NEW.user_id AND group_id = NEW.group_id AND type = 'streak' AND title = ('Streak: ' || t || ' days');
                IF achievement_exists = 0 THEN
                    INSERT INTO achievements (user_id, group_id, type, title, description)
                    VALUES (
                        NEW.user_id,
                        NEW.group_id,
                        'streak',
                        'Streak: ' || t || ' days',
                        'Você treinou ' || t || ' dias seguidos!'
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on activities table
DROP TRIGGER IF EXISTS trigger_update_streak_days ON activities;
CREATE TRIGGER trigger_update_streak_days
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_days_on_valid_activity(); 