-- Garantir permissão de SELECT para authenticated na tabela payment_history
GRANT SELECT ON public.payment_history TO authenticated; 