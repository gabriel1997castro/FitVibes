-- Create balances table
CREATE TABLE IF NOT EXISTS public.balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    owed_to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_balances_group_id ON public.balances(group_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON public.balances(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_owed_to_user_id ON public.balances(owed_to_user_id);

-- Enable Row Level Security
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for balances
CREATE POLICY "Balances are viewable by group members" ON public.balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = balances.group_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Balances are insertable by group members" ON public.balances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = balances.group_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Balances are updatable by group members" ON public.balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = balances.group_id AND gm.user_id = auth.uid()
        )
    ); 