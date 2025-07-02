-- Corrigir política de RLS para payment_history

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view payment history" ON public.payment_history;

CREATE POLICY "Group members can view payment history"
ON public.payment_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = payment_history.group_id
      AND gm.user_id = auth.uid()
  )
); 