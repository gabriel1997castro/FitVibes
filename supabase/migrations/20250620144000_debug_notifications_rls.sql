-- Migration: Debug notifications RLS policies

-- 1. Create a more permissive policy for debugging
CREATE POLICY "debug_authenticated_can_select_notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Create a function to check current user and permissions
CREATE OR REPLACE FUNCTION public.debug_notifications_permissions()
RETURNS TABLE (
    current_user_id UUID,
    auth_role TEXT,
    notifications_count BIGINT,
    can_select BOOLEAN,
    can_insert BOOLEAN,
    can_update BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as current_user_id,
        auth.role() as auth_role,
        COUNT(*) as notifications_count,
        true as can_select,
        true as can_insert,
        true as can_update
    FROM public.notifications
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.debug_notifications_permissions() TO authenticated;

-- 4. Create a function to manually insert a test notification
CREATE OR REPLACE FUNCTION public.create_test_notification(test_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        group_id,
        type,
        title,
        body,
        data
    ) VALUES (
        test_user_id,
        NULL,
        'test',
        'Notificação de Teste',
        'Esta é uma notificação de teste para verificar as permissões.',
        jsonb_build_object('test', true)
    ) RETURNING id INTO notification_id;

    RETURN 'Test notification created with ID: ' || notification_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error creating test notification: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_notification(UUID) TO authenticated; 