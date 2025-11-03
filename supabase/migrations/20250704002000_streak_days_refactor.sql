-- Migration: Adiciona campos para controle refinado de streaks

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS last_valid_activity_date DATE;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_valid_activity_date_global DATE;
-- (mantém o nome global_streak_days já existente) 