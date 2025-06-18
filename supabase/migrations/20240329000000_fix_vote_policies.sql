-- Drop existing vote policies
DROP POLICY IF EXISTS "Votes are viewable by group creator" ON public.votes;
DROP POLICY IF EXISTS "Votes are viewable by group members" ON public.votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.votes;

-- Create new vote policies
CREATE POLICY "Votes are viewable by group members" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.activities a ON a.id = votes.activity_id
            WHERE gm.group_id = a.group_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = voter_id); 