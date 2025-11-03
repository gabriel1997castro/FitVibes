# reset-streaks-by-timezone

Edge Function para resetar streaks de grupos no horário local de cada grupo.

- Roda a cada hora (cron: `0 * * * *`)
- Para cada grupo, verifica se é meia-noite local
- Chama a função SQL `reset_streaks_for_group` para resetar streaks dos membros do grupo
- Usa Luxon para manipulação de timezone

**Importante:**
- A função SQL de reset global (`reset_streaks_daily`) foi removida.
- O reset é feito apenas para grupos cujo horário local está entre 00:00 e 00:09. 