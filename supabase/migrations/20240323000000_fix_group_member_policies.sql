-- Add policy to allow users to join groups
CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id
        )
    );

-- Add policy to allow users to view their own group memberships
CREATE POLICY "Users can view their own group memberships" ON public.group_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    ); 