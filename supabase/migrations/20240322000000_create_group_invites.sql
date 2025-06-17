-- Create group_invites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT valid_invite CHECK (
        (used_at IS NULL AND used_by IS NULL) OR
        (used_at IS NOT NULL AND used_by IS NOT NULL)
    )
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invites_group_id') THEN
        CREATE INDEX idx_group_invites_group_id ON public.group_invites(group_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invites_invite_code') THEN
        CREATE INDEX idx_group_invites_invite_code ON public.group_invites(invite_code);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invites_invited_by') THEN
        CREATE INDEX idx_group_invites_invited_by ON public.group_invites(invited_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invites_used_by') THEN
        CREATE INDEX idx_group_invites_used_by ON public.group_invites(used_by);
    END IF;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'group_invites' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group invites are viewable by group creator" ON public.group_invites;
DROP POLICY IF EXISTS "Group creator can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group creator can update invites" ON public.group_invites;
DROP POLICY IF EXISTS "Anyone can view invites by code" ON public.group_invites;
DROP POLICY IF EXISTS "Users can join with valid invite" ON public.group_members;
DROP POLICY IF EXISTS "Group creator can add self as admin" ON public.group_members;
DROP POLICY IF EXISTS "Users can join as member with valid invite" ON public.group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Group members are viewable by group creator" ON public.group_members;
DROP POLICY IF EXISTS "Group creator can manage members" ON public.group_members;

-- Create RLS policies for group_invites
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

-- Add new policy to allow viewing invites by code
CREATE POLICY "Anyone can view invites by code" ON public.group_invites
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        invite_code IS NOT NULL
    );

-- Create RLS policies for group_members
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Group creator can add members" ON public.group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id
            AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can join with valid invite" ON public.group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_invites gi
            WHERE gi.group_id = group_members.group_id
            AND gi.invite_code IS NOT NULL
            AND gi.used_at IS NULL
            AND gi.expires_at > NOW()
        )
    );

CREATE POLICY "Group creator can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = group_members.group_id
            AND g.created_by = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.group_invites TO authenticated;
GRANT ALL ON public.group_members TO authenticated; 