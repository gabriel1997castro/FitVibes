-- Drop existing activity policies
DROP POLICY IF EXISTS "Activities are viewable by group creator" ON public.activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;

-- Create new activity policies
CREATE POLICY "Activities are viewable by group members" ON public.activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities in their groups" ON public.activities
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own activities" ON public.activities
    FOR UPDATE USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    ); 