-- 20250621001000_fix_group_members_view_policy_final.sql

-- Remove políticas antigas
DROP POLICY IF EXISTS "Group members are viewable by group creator" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;

-- Cria política correta e segura
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members AS gm
            WHERE gm.group_id = group_members.group_id
              AND gm.user_id = auth.uid()
        )
    ); 