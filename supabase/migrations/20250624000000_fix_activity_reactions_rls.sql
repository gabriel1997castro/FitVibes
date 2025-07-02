-- Drop existing policies for activity_reactions
DROP POLICY IF EXISTS "Users can manage their own reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can view all reactions" ON activity_reactions;

-- Disable RLS temporarily to reset
ALTER TABLE activity_reactions DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies
CREATE POLICY "Enable all operations for authenticated users" ON activity_reactions
FOR ALL USING (auth.uid() IS NOT NULL);

-- Alternative: Create specific policies if the above doesn't work
-- CREATE POLICY "Enable insert for authenticated users" ON activity_reactions
-- FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Enable select for authenticated users" ON activity_reactions
-- FOR SELECT USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "Enable update for authenticated users" ON activity_reactions
-- FOR UPDATE USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "Enable delete for authenticated users" ON activity_reactions
-- FOR DELETE USING (auth.uid() IS NOT NULL); 