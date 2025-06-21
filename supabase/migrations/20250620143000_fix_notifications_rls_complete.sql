-- Migration: Complete fix for notifications RLS policies

-- 1. First, let's check if RLS is enabled and disable it temporarily
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.notifications;

-- 3. Re-enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create comprehensive policies for authenticated users
CREATE POLICY "authenticated_users_can_select_own_notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_can_update_own_notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_can_insert_notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 5. Create policy for system functions (triggers) to insert notifications
CREATE POLICY "system_can_insert_notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. Grant all necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Create a test function to verify permissions
CREATE OR REPLACE FUNCTION public.test_notifications_access(test_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    notification_count INTEGER;
BEGIN
    -- Try to count notifications for the user
    SELECT COUNT(*) INTO notification_count 
    FROM public.notifications 
    WHERE user_id = test_user_id;
    
    RETURN 'Success: Found ' || notification_count || ' notifications for user ' || test_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission on test function
GRANT EXECUTE ON FUNCTION public.test_notifications_access(UUID) TO authenticated; 