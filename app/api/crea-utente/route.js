import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
const { email, nome, telefono, password, ruolo, paziente_id, ristorante_id } = await request.json()
  // Client con service_role per creare utenti (solo lato server)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Crea utente in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 })
  }

  // Crea profilo nel database
const { error: profileError } = await supabaseAdmin.from('profili').insert({
  id: authData.user.id,
  nome,
  ruolo,
  telefono: telefono || null,
  paziente_id: paziente_id || null,
  ristorante_id: ristorante_id || null,
})

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 400 })
  }

  return Response.json({ success: true, nome })
}
