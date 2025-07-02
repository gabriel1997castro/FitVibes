-- Ensure RLS is enabled on activity_reactions
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON activity_reactions;
DROP POLICY IF EXISTS "Users can manage their own reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can view all reactions" ON activity_reactions;

-- Create secure policies for activity_reactions
-- Users can insert their own reactions
CREATE POLICY "Users can insert their own reactions" ON activity_reactions
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view reactions on activities from their groups
CREATE POLICY "Users can view reactions from their groups" ON activity_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM activities a
        JOIN group_members gm ON a.group_id = gm.group_id
        WHERE a.id = activity_reactions.activity_id
        AND gm.user_id = auth.uid()
    )
);

-- Users can update their own reactions
CREATE POLICY "Users can update their own reactions" ON activity_reactions
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON activity_reactions
FOR DELETE USING (user_id = auth.uid()); 