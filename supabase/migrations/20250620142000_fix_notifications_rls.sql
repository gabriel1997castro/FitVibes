-- Migration: Fix RLS policies for notifications table

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- 2. Create correct policies for authenticated users
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON public.notifications TO authenticated; 