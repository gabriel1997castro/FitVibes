-- Migration: Fix RLS policies for achievements table

-- 1. Drop all existing RLS policies on achievements table
DROP POLICY IF EXISTS "All can select achievements" ON achievements;
DROP POLICY IF EXISTS "Allow all select" ON achievements;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view achievements in their groups" ON achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;

-- 2. Enable RLS on achievements table
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 3. Create clean RLS policies for achievements
-- Policy for users to view their own achievements (both global and group-specific)
CREATE POLICY "Users can view their own achievements" ON achievements
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id 
            FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for system to insert achievements (for triggers)
CREATE POLICY "System can insert achievements" ON achievements
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for users to view global achievements (achievements with group_id = NULL)
CREATE POLICY "Users can view global achievements" ON achievements
    FOR SELECT
    TO authenticated
    USING (group_id IS NULL);

-- 4. Grant necessary permissions
GRANT SELECT ON achievements TO authenticated;
GRANT INSERT ON achievements TO authenticated; 