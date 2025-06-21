-- 20250621003000_remove_conflicting_policies.sql

-- Remove a política conflitante que está causando recursão infinita
DROP POLICY IF EXISTS "Users can view their own group memberships" ON public.group_members;

-- Remove também a política que criamos anteriormente para recriar corretamente
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;

-- Recria a política correta: membros podem ver todos os membros do grupo
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members AS gm
            WHERE gm.group_id = group_members.group_id
              AND gm.user_id = auth.uid()
        )
    ); 