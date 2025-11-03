-- Função: reset_streaks_for_group
CREATE OR REPLACE FUNCTION public.reset_streaks_for_group(p_group_id UUID)
RETURNS void AS $$
BEGIN
  -- Zera streak de grupo se não teve atividade válida ontem (no timezone do grupo)
  UPDATE group_members gm
  SET streak_days = 0
  WHERE gm.group_id = p_group_id
    AND (gm.last_valid_activity_date IS NULL OR gm.last_valid_activity_date < CURRENT_DATE - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 