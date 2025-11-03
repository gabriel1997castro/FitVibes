-- Migration: Adiciona campo timezone na tabela groups

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo'; 