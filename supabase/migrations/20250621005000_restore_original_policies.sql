-- 20250621005000_restore_original_policies.sql

-- Remover todas as políticas que criamos
DROP POLICY IF EXISTS "Group creator can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.group_members;

-- Restaurar as políticas originais
CREATE POLICY "Group members are viewable by group creator" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Group creator can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id
        )
    );

CREATE POLICY "Users can view their own group memberships" ON public.group_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    ); 