-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;

-- Create new policies for activity updates
CREATE POLICY "Users can update their own activities" ON public.activities
    FOR UPDATE USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    );

-- Add policy for updating activity status through voting
CREATE POLICY "Group members can update activity status" ON public.activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = activities.group_id AND gm.user_id = auth.uid()
        )
    ); 