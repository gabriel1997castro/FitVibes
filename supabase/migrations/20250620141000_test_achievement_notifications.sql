-- Migration: Create test function for achievement notifications

-- Create a function to test achievement notifications
CREATE OR REPLACE FUNCTION public.test_achievement_notifications(test_user_id UUID, test_group_id UUID)
RETURNS TEXT AS $$
DECLARE
    test_activity_id UUID;
    notification_count INTEGER;
    achievement_count INTEGER;
BEGIN
    -- Create a test activity
    INSERT INTO activities (group_id, user_id, type, exercise_type, duration_minutes, date, status)
    VALUES (test_group_id, test_user_id, 'exercise', 'test', 30, CURRENT_DATE, 'pending')
    RETURNING id INTO test_activity_id;

    -- Count achievements before
    SELECT COUNT(*) INTO achievement_count FROM achievements WHERE user_id = test_user_id;
    
    -- Count notifications before
    SELECT COUNT(*) INTO notification_count FROM notifications WHERE user_id = test_user_id;

    -- Update activity to valid to trigger achievements
    UPDATE activities SET status = 'valid' WHERE id = test_activity_id;

    -- Count achievements after
    SELECT COUNT(*) - achievement_count INTO achievement_count FROM achievements WHERE user_id = test_user_id;
    
    -- Count notifications after
    SELECT COUNT(*) - notification_count INTO notification_count FROM notifications WHERE user_id = test_user_id;

    -- Clean up test activity
    DELETE FROM activities WHERE id = test_activity_id;

    RETURN 'Achievements created: ' || achievement_count || ', Notifications created: ' || notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.test_achievement_notifications(UUID, UUID) TO authenticated; 