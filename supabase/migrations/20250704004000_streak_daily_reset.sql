-- Migration: Função para reset diário de streaks (grupo e global)

CREATE OR REPLACE FUNCTION public.reset_streaks_daily()
RETURNS void AS $$
BEGIN
  -- Zera streak de grupo se não teve atividade válida ontem
  UPDATE group_members
  SET streak_days = 0
  WHERE last_valid_activity_date IS NULL OR last_valid_activity_date < CURRENT_DATE - 1;

  -- Zera streak global se não teve atividade válida ontem
  UPDATE users
  SET global_streak_days = 0
  WHERE last_valid_activity_date_global IS NULL OR last_valid_activity_date_global < CURRENT_DATE - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Para agendar: usar Edge Function, cronjob externo ou Supabase Scheduler (quando disponível)
-- Exemplo de chamada manual:
-- SELECT reset_streaks_daily(); 