import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not set')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, userData, password } = await req.json()

    if (action === 'create') {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: password,
        email_confirm: true,
        user_metadata: { name: userData.name, role: userData.role },
      })

      if (authError && !authError.message.includes('already registered')) {
        throw new Error(`Auth Error: ${authError.message}`)
      }

      const finalUserId = authData?.user?.id || userData.id

      // 2. Insert or update in public.users
      const { error: dbError } = await supabase.from('users').upsert(
        {
          id: finalUserId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          active: userData.active,
        },
        { onConflict: 'email' },
      )

      if (dbError) throw new Error(`Database Error: ${dbError.message}`)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      if (password) {
        // Try to update auth password
        const {
          data: { users },
          error: listError,
        } = await supabase.auth.admin.listUsers()
        if (!listError) {
          const u = users.find((u) => u.email === userData.email)
          if (u) {
            await supabase.auth.admin.updateUserById(u.id, { password })
          }
        }
      }

      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          role: userData.role,
        })
        .eq('id', userData.id)

      if (dbError) throw new Error(`Database Error: ${dbError.message}`)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update_status') {
      const { error: dbError } = await supabase
        .from('users')
        .update({
          active: userData.active,
        })
        .eq('id', userData.id)

      if (dbError) throw new Error(`Database Error: ${dbError.message}`)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
