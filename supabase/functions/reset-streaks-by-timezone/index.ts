import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3.4.3';

serve(async (req) => {
  console.log('[reset-streaks-by-timezone] Iniciando execução...');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Busca todos os grupos e seus timezones
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name, timezone');
  if (groupsError) {
    console.error('[reset-streaks-by-timezone] Erro ao buscar grupos:', groupsError.message);
    return new Response(JSON.stringify({ error: groupsError.message }), { status: 500 });
  }
  console.log(`[reset-streaks-by-timezone] ${groups.length} grupos encontrados.`);

  // Hora UTC atual
  const nowUtc = DateTime.utc();
  let resets = [];
  const timezonesResetados = new Set();

  for (const group of groups) {
    const tz = group.timezone || 'America/Sao_Paulo';
    const nowLocal = nowUtc.setZone(tz);
    console.log(`[reset-streaks-by-timezone] hour ${nowLocal.hour}`);
    // Se for meia-noite local (00:00 a 00:09)
    if (nowLocal.hour === 15 && nowLocal.minute < 45) {
      // Reset global streak para esse timezone (apenas 1x por timezone)
      if (!timezonesResetados.has(tz)) {
        console.log(`[reset-streaks-by-timezone] [GLOBAL] Iniciando reset global para timezone ${tz} (hora local: ${nowLocal.toISO()})`);
        const { error: globalError } = await supabase.rpc('reset_global_streaks_for_timezone');
        if (globalError) {
          console.error(`[reset-streaks-by-timezone] [GLOBAL] Erro ao resetar streak global para timezone ${tz}:`, globalError.message);
          resets.push({ timezone: tz, global: 'error', error: globalError.message });
        } else {
          console.log(`[reset-streaks-by-timezone] [GLOBAL] Reset global concluído para timezone ${tz}`);
          resets.push({ timezone: tz, global: 'reset' });
        }
        timezonesResetados.add(tz);
      }
      console.log(`[reset-streaks-by-timezone] Resetando streaks para grupo ${group.name} (${group.id}) no timezone ${tz} (hora local: ${nowLocal.toISO()})`);
      const { error } = await supabase.rpc('reset_streaks_for_group', { p_group_id: group.id });
      if (error) {
        console.error(`[reset-streaks-by-timezone] Erro ao resetar grupo ${group.id}:`, error.message);
        resets.push({ group: group.id, error: error.message });
      } else {
        resets.push({ group: group.id, status: 'reset' });
      }
    } else {
      console.log(`[reset-streaks-by-timezone] Grupo ${group.name} (${group.id}) - não é meia-noite local (${nowLocal.toFormat('HH:mm')}) no timezone ${tz}`);
    }
  }

  console.log('[reset-streaks-by-timezone] Resumo dos resets:', JSON.stringify(resets));
  return new Response(JSON.stringify({ resets }), { headers: { 'Content-Type': 'application/json' } });
}); 