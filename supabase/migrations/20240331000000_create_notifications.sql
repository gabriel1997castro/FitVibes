-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_group_id ON public.notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle balance notifications
CREATE OR REPLACE FUNCTION public.handle_balance_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify user who owes money
    INSERT INTO public.notifications (
        user_id,
        group_id,
        type,
        title,
        body,
        data
    ) VALUES (
        NEW.user_id,
        NEW.group_id,
        'balance_created',
        'Novo saldo pendente',
        'Você tem um novo saldo pendente no grupo.',
        jsonb_build_object(
            'balance_id', NEW.id,
            'amount', NEW.amount,
            'owed_to_user_id', NEW.owed_to_user_id
        )
    );

    -- Notify user who is owed money
    INSERT INTO public.notifications (
        user_id,
        group_id,
        type,
        title,
        body,
        data
    ) VALUES (
        NEW.owed_to_user_id,
        NEW.group_id,
        'balance_created',
        'Novo saldo a receber',
        'Você tem um novo saldo a receber no grupo.',
        jsonb_build_object(
            'balance_id', NEW.id,
            'amount', NEW.amount,
            'user_id', NEW.user_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle payment notifications
CREATE OR REPLACE FUNCTION public.handle_payment_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
        -- Notify user who paid
        INSERT INTO public.notifications (
            user_id,
            group_id,
            type,
            title,
            body,
            data
        ) VALUES (
            NEW.user_id,
            NEW.group_id,
            'payment_made',
            'Pagamento realizado',
            'Você marcou um pagamento como realizado.',
            jsonb_build_object(
                'balance_id', NEW.id,
                'amount', NEW.amount,
                'owed_to_user_id', NEW.owed_to_user_id
            )
        );

        -- Notify user who received payment
        INSERT INTO public.notifications (
            user_id,
            group_id,
            type,
            title,
            body,
            data
        ) VALUES (
            NEW.owed_to_user_id,
            NEW.group_id,
            'payment_received',
            'Pagamento recebido',
            'Um pagamento foi marcado como realizado para você.',
            jsonb_build_object(
                'balance_id', NEW.id,
                'amount', NEW.amount,
                'user_id', NEW.user_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for balance notifications
DROP TRIGGER IF EXISTS on_balance_created ON public.balances;
CREATE TRIGGER on_balance_created
    AFTER INSERT ON public.balances
    FOR EACH ROW EXECUTE FUNCTION public.handle_balance_notification();

DROP TRIGGER IF EXISTS on_balance_updated ON public.balances;
CREATE TRIGGER on_balance_updated
    AFTER UPDATE ON public.balances
    FOR EACH ROW EXECUTE FUNCTION public.handle_payment_notification();

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated; 