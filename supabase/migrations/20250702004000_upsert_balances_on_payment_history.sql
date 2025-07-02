-- Trigger para consolidar penalidades em balances, considerando ciclo semanal ou mensal do grupo

CREATE OR REPLACE FUNCTION public.upsert_balance_on_payment_history()
RETURNS TRIGGER AS $$
DECLARE
  cycle_start DATE;
  cycle_end DATE;
  payment_cycle TEXT;
  existing_balance_id UUID;
BEGIN
  -- Buscar tipo de ciclo do grupo
  SELECT payment_cycle INTO payment_cycle FROM groups WHERE id = NEW.group_id;

  IF payment_cycle = 'weekly' THEN
    -- Ciclo semanal: começa na segunda-feira
    cycle_start := date_trunc('week', NEW.created_at::date) + INTERVAL '1 day';
    cycle_end := cycle_start + INTERVAL '6 days';
  ELSIF payment_cycle = 'monthly' THEN
    -- Ciclo mensal: do primeiro ao último dia do mês
    cycle_start := date_trunc('month', NEW.created_at::date);
    cycle_end := (date_trunc('month', NEW.created_at::date) + INTERVAL '1 month - 1 day')::date;
  ELSE
    RAISE EXCEPTION 'Tipo de ciclo desconhecido para o grupo %', NEW.group_id;
  END IF;

  -- Procurar saldo existente
  SELECT id INTO existing_balance_id FROM balances
    WHERE group_id = NEW.group_id
      AND user_id = NEW.from_user_id
      AND owed_to_user_id = NEW.to_user_id
      AND cycle_start_date = cycle_start
      AND cycle_end_date = cycle_end;

  IF existing_balance_id IS NOT NULL THEN
    -- Atualizar saldo existente
    UPDATE balances
      SET amount = amount + NEW.amount,
          updated_at = now()
      WHERE id = existing_balance_id;
  ELSE
    -- Criar novo saldo
    INSERT INTO balances (
      id, group_id, user_id, owed_to_user_id, amount,
      cycle_start_date, cycle_end_date, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.group_id,
      NEW.from_user_id,
      NEW.to_user_id,
      NEW.amount,
      cycle_start,
      cycle_end,
      'pending',
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_upsert_balance_on_payment_history ON payment_history;
CREATE TRIGGER trigger_upsert_balance_on_payment_history
AFTER INSERT ON payment_history
FOR EACH ROW
EXECUTE FUNCTION public.upsert_balance_on_payment_history(); 