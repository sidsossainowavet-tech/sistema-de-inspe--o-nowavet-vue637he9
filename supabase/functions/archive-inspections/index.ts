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

    // Data limite: 15 dias atrás
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    let body: any = {}
    try {
      if (req.method === 'POST') {
        body = await req.json()
      }
    } catch (e) {}

    const archiveAll = body.all === true

    let query = supabase.from('inspections').select('*')
    if (!archiveAll) {
      // Filtrar apenas as criadas há mais de 15 dias
      query = query.lte('date', fifteenDaysAgo.toISOString())
    }

    const { data: inspections, error: fetchError } = await query

    if (fetchError) throw fetchError

    if (!inspections || inspections.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma inspeção para arquivar.',
          archivedCount: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const idsToDelete = inspections.map((i: any) => i.id)

    // Formatar como JSON
    const jsonContent = JSON.stringify(inspections, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_inspecoes_${timestamp}.json`

    // Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('archived_inspections')
      .upload(fileName, jsonContent, {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Deletar os registros do banco
    const { error: deleteError } = await supabase.from('inspections').delete().in('id', idsToDelete)

    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({
        success: true,
        archivedCount: inspections.length,
        fileName,
        message: `${inspections.length} inspeções foram arquivadas com sucesso.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
