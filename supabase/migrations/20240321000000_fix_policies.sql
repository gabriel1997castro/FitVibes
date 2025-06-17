-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.group_members TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.votes TO authenticated;
GRANT ALL ON public.balances TO authenticated;
GRANT ALL ON public.group_invites TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups are viewable by authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group creator can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group members are viewable by members" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group creator" ON public.group_members;
DROP POLICY IF EXISTS "Group creator can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Activities are viewable by group members" ON public.activities;
DROP POLICY IF EXISTS "Activities are viewable by group creator" ON public.activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Votes are viewable by group members" ON public.votes;
DROP POLICY IF EXISTS "Votes are viewable by group creator" ON public.votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Balances are viewable by group members" ON public.balances;
DROP POLICY IF EXISTS "Balances are viewable by group creator" ON public.balances;
DROP POLICY IF EXISTS "Group invites are viewable by group creator" ON public.group_invites;
DROP POLICY IF EXISTS "Group creator can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group creator can update invites" ON public.group_invites;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for groups table
CREATE POLICY "Groups are viewable by authenticated users" ON public.groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creator can update their groups" ON public.groups
    FOR UPDATE USING (created_by = auth.uid());

-- Create RLS policies for group_members table
CREATE POLICY "Group members are viewable by group creator" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Group creator can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

-- Create RLS policies for activities table
CREATE POLICY "Activities are viewable by group creator" ON public.activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = activities.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create their own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for votes table
CREATE POLICY "Votes are viewable by group creator" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            JOIN public.activities a ON a.id = votes.activity_id
            WHERE g.id = a.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Create RLS policies for balances table
CREATE POLICY "Balances are viewable by group creator" ON public.balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = balances.group_id AND g.created_by = auth.uid()
        )
    );

-- Create RLS policies for group_invites table
CREATE POLICY "Group invites are viewable by group creator" ON public.group_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_invites.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Group creator can create invites" ON public.group_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_invites.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Group creator can update invites" ON public.group_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_invites.group_id AND g.created_by = auth.uid()
        )
    ); 