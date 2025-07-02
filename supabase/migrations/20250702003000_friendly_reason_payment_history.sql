-- Ajustar trigger para salvar reason amigável em payment_history

DROP FUNCTION IF EXISTS public.insert_payment_history_on_invalid_activity CASCADE;

CREATE OR REPLACE FUNCTION public.insert_payment_history_on_invalid_activity()
RETURNS TRIGGER AS $$
DECLARE
    penalty NUMERIC;
    n_receivers INTEGER;
    receiver RECORD;
    reason_text TEXT;
BEGIN
    -- Só roda se status mudou para 'invalid'
    IF NEW.status = 'invalid' AND (OLD.status IS DISTINCT FROM 'invalid') THEN
        -- Buscar valor da penalidade do grupo
        SELECT penalty_amount INTO penalty FROM groups WHERE id = NEW.group_id;
        -- Contar membros ativos (exceto o autor)
        SELECT COUNT(*) INTO n_receivers FROM group_members WHERE group_id = NEW.group_id AND user_id <> NEW.user_id;
        IF n_receivers = 0 THEN
            RETURN NEW;
        END IF;
        -- Motivo: se for desculpa, concatena categoria e texto de forma amigável
        IF NEW.type = 'excuse' OR NEW.type = 'auto_excuse' THEN
            IF NEW.excuse_category IS NOT NULL AND NEW.excuse_text IS NOT NULL THEN
                reason_text := NEW.excuse_category || ' — ' || NEW.excuse_text;
            ELSIF NEW.excuse_category IS NOT NULL THEN
                reason_text := NEW.excuse_category;
            ELSIF NEW.excuse_text IS NOT NULL THEN
                reason_text := NEW.excuse_text;
            ELSE
                reason_text := 'Desculpa inválida';
            END IF;
        ELSE
            reason_text := 'Atividade inválida';
        END IF;
        -- Para cada membro ativo (exceto o autor), inserir registro
        FOR receiver IN SELECT user_id FROM group_members WHERE group_id = NEW.group_id AND user_id <> NEW.user_id LOOP
            INSERT INTO payment_history (
                group_id, post_id, from_user_id, to_user_id, reason, amount, created_at
            ) VALUES (
                NEW.group_id,
                NEW.id,
                NEW.user_id,
                receiver.user_id,
                reason_text,
                ROUND(penalty / n_receivers, 2),
                now()
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_insert_payment_history_on_invalid_activity ON activities;
CREATE TRIGGER trigger_insert_payment_history_on_invalid_activity
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.insert_payment_history_on_invalid_activity(); 