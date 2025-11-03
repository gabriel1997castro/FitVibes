-- Função: reset_global_streaks_for_timezone
CREATE OR REPLACE FUNCTION public.reset_global_streaks_for_timezone()
RETURNS void AS $$
BEGIN
  -- Zera streak global se não teve atividade válida ontem
  UPDATE users
  SET global_streak_days = 0
  WHERE last_valid_activity_date_global IS NULL OR last_valid_activity_date_global < CURRENT_DATE - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 