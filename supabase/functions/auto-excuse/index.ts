import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AUTO_EXCUSE_MESSAGES = [
  "Hoje não treinei porque fui muito migué! 😅",
  "Meu gato comeu minha roupa de treino... de novo! 😺",
  "A Netflix lançou uma nova temporada e eu não resisti! 📺",
  "Meu despertador também deu migué hoje! ⏰",
  "A cama me abraçou e não me soltou! 🛏️",
  "Meu cachorro escondeu meu tênis... de novo! 🐕",
  "A pizza da noite passada me fez companhia o dia todo! 🍕",
  "Meu sofá me hipnotizou com seu poder de conforto! 🛋️",
  "A chuva caiu só no meu bairro... acredite! 🌧️",
  "Meu celular ficou sem bateria e eu não sabia a hora! 📱",
  "O elevador do prédio quebrou... e eu moro no 2º andar! 🏢",
  "Meu tênis deu nó nos cadarços sozinho! 👟",
  "A Netflix me recomendou exatamente o que eu queria ver! 🎬",
  "Meu gato fez birra e não quis me deixar sair! 😸",
  "A cama estava muito confortável hoje... de novo! 😴"
]

function getRandomExcuse(): string {
  const randomIndex = Math.floor(Math.random() * AUTO_EXCUSE_MESSAGES.length)
  return AUTO_EXCUSE_MESSAGES[randomIndex]
}

async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { type: 'auto_excuse' },
  }

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Get all groups
    const { data: groups, error: groupsError } = await supabaseClient
      .from('groups')
      .select('id, name')

    if (groupsError) throw groupsError

    // For each group, get all members
    for (const group of groups) {
      const { data: members, error: membersError } = await supabaseClient
        .from('group_members')
        .select(`
          user_id,
          users (
            notification_token,
            name
          )
        `)
        .eq('group_id', group.id)

      if (membersError) throw membersError

      // For each member, check if they have an activity for yesterday
      for (const member of members) {
        const { data: activity, error: activityError } = await supabaseClient
          .from('activities')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', member.user_id)
          .eq('date', yesterdayStr)
          .single()

        if (activityError && activityError.code !== 'PGRST116') throw activityError

        // If no activity exists, create auto-excuse
        if (!activity) {
          const excuseText = getRandomExcuse()
          
          const { error: insertError } = await supabaseClient
            .from('activities')
            .insert({
              group_id: group.id,
              user_id: member.user_id,
              type: 'auto_excuse',
              excuse_category: 'other',
              excuse_text: excuseText,
              date: yesterdayStr,
              status: 'pending'
            })

          if (insertError) throw insertError

          // Send push notification if user has a notification token
          if (member.users?.notification_token) {
            await sendPushNotification(
              member.users.notification_token,
              `Migué Automático em ${group.name}!`,
              `Ops! Criamos uma desculpa automática para você: "${excuseText}"`
            )
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Auto-excuses created and notifications sent successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 