-- 20250621004000_disable_rls_temporarily.sql

-- Desabilitar RLS temporariamente na tabela group_members para resolver recursão infinita
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Group creator can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Recriar apenas as políticas essenciais sem recursão
CREATE POLICY "Enable all for authenticated users" ON public.group_members
    FOR ALL USING (auth.role() = 'authenticated'); 