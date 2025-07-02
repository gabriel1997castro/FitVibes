-- Drop all existing policies on activity_reactions
DROP POLICY IF EXISTS "insert_own_reactions" ON activity_reactions;
DROP POLICY IF EXISTS "view_group_reactions" ON activity_reactions;
DROP POLICY IF EXISTS "update_own_reactions" ON activity_reactions;
DROP POLICY IF EXISTS "delete_own_reactions" ON activity_reactions;

-- Ensure RLS is enabled
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy that allows authenticated users to do everything
CREATE POLICY "authenticated_users_all" ON activity_reactions
FOR ALL USING (auth.uid() IS NOT NULL); 