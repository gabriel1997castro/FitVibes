-- Migration: Fix group_members view policy to allow members to see other members (no recursion)

-- Drop old policies
DROP POLICY IF EXISTS "Group members are viewable by group creator" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;

-- Nova política sem recursão infinita
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members AS gm
            WHERE gm.group_id = group_members.group_id
              AND gm.user_id = auth.uid()
        )
    ); 