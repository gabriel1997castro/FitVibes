-- 20250621002000_fix_group_members_policy_simple.sql

-- Remove todas as políticas problemáticas
DROP POLICY IF EXISTS "Group members are viewable by group creator" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;

-- Política simples: qualquer usuário autenticado pode ver membros de grupos onde ele é membro
-- Usando uma abordagem diferente para evitar recursão
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.group_members 
            WHERE group_id = group_members.group_id
        )
    ); 