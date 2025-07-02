-- Migration: Criação da tabela payment_history para histórico detalhado de penalidades

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL, -- exemplo: 'desculpa inválida', 'não postou'
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_payment_history_group_id ON public.payment_history(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_from_user_id ON public.payment_history(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_to_user_id ON public.payment_history(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at);

-- RLS: Apenas membros do grupo podem ver
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view payment history" ON public.payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = payment_history.group_id AND gm.user_id = auth.uid()
        )
    ); 