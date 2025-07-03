-- Migration: Trigger para atualizar status da atividade após todos os votos

CREATE OR REPLACE FUNCTION update_activity_status_after_vote()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id uuid;
  v_owner_id uuid;
  total_voters integer;
  total_votes integer;
  valid_votes integer;
BEGIN
  -- Descobre o grupo e o dono da atividade
  SELECT group_id, user_id INTO v_group_id, v_owner_id FROM activities WHERE id = NEW.activity_id;

  -- Conta membros do grupo (exceto o dono da atividade)
  SELECT count(*) INTO total_voters
  FROM group_members_visible
  WHERE group_id = v_group_id AND user_id <> v_owner_id;

  -- Conta votos já feitos para a atividade
  SELECT count(*) INTO total_votes
  FROM votes
  WHERE activity_id = NEW.activity_id;

  -- Conta votos válidos
  SELECT count(*) INTO valid_votes
  FROM votes
  WHERE activity_id = NEW.activity_id AND is_valid = true;

  -- Se todos votaram, atualiza status
  IF total_votes = total_voters THEN
    UPDATE activities
    SET status = CASE WHEN valid_votes > total_votes / 2 THEN 'valid' ELSE 'invalid' END
    WHERE id = NEW.activity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_status ON votes;
CREATE TRIGGER trigger_update_activity_status
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_activity_status_after_vote(); 