-- Migration: Refined streak trigger (primeira válida do dia, datas, reset, increment)

CREATE OR REPLACE FUNCTION public.update_streak_days_on_valid_activity()
RETURNS TRIGGER AS $$
DECLARE
    already_valid_today INTEGER;
    last_valid_group_date DATE;
    last_valid_global_date DATE;
BEGIN
    -- Só executa se status mudou para 'valid'
    IF NEW.status = 'valid' AND (OLD.status IS DISTINCT FROM 'valid') THEN
        -- Checa se já existe outra atividade válida do usuário nesse grupo e data
        SELECT COUNT(*) INTO already_valid_today
        FROM activities
        WHERE user_id = NEW.user_id
          AND group_id = NEW.group_id
          AND status = 'valid'
          AND date = NEW.date
          AND id <> NEW.id;

        IF already_valid_today = 0 THEN
            -- Atualiza streak do grupo
            SELECT last_valid_activity_date INTO last_valid_group_date
            FROM group_members
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;

            IF last_valid_group_date = NEW.date - INTERVAL '1 day' THEN
                UPDATE group_members
                SET streak_days = streak_days + 1
                WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
            ELSE
                UPDATE group_members
                SET streak_days = 1
                WHERE user_id = NEW.user_id AND group_id = NEW.group_id;
            END IF;
            UPDATE group_members
            SET last_valid_activity_date = NEW.date
            WHERE user_id = NEW.user_id AND group_id = NEW.group_id;

            -- Atualiza streak global
            SELECT last_valid_activity_date_global INTO last_valid_global_date
            FROM users WHERE id = NEW.user_id;

            IF last_valid_global_date = NEW.date - INTERVAL '1 day' THEN
                UPDATE users
                SET global_streak_days = global_streak_days + 1
                WHERE id = NEW.user_id;
            ELSE
                UPDATE users
                SET global_streak_days = 1
                WHERE id = NEW.user_id;
            END IF;
            UPDATE users
            SET last_valid_activity_date_global = NEW.date
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_streak_days ON activities;
CREATE TRIGGER trigger_update_streak_days
AFTER UPDATE OF status ON activities
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_days_on_valid_activity(); 