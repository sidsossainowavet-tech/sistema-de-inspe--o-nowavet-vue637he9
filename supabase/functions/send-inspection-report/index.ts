import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const inspection = body.inspection || {}
    let contacts = body.contacts || []

    // Ensure auditoria email is present explicitly
    if (!contacts.some((c: any) => c.email === 'auditoria.interna@nowavet.com.br')) {
      contacts.push({ email: 'auditoria.interna@nowavet.com.br', sector: 'Auditoria Interna' })
    }

    console.log(`[EMAIL SEND SIMULATION] Processing Report for Inspection ID: ${inspection.id}`)
    console.log(`Recipients: ${contacts.map((c: any) => c.email).join(', ') || 'none'}`)
    console.log(`Structure: ${inspection.structure}`)
    console.log(`Type: ${inspection.type}`)
    console.log(`Date: ${inspection.date}`)
    console.log(`Photos attached: ${inspection.answers?.filter((a: any) => a.photo).length || 0}`)

    const ncs = inspection.answers?.filter((a: any) => a.status === 'NC') || []
    console.log(`Non-Conformities found: ${ncs.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Report transferred successfully via email (simulation) to auditoria.interna@nowavet.com.br and other contacts',
        deliveredTo: contacts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
