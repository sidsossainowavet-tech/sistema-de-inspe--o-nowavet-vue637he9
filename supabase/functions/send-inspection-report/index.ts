import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const inspection = body.inspection || {}
    let contacts = body.contacts || []

    // Assegura que a auditoria está na lista de contatos
    if (!contacts.some((c: any) => c.email === 'auditoria.interna@nowavet.com.br')) {
      contacts.push({ email: 'auditoria.interna@nowavet.com.br', sector: 'Auditoria Interna' })
    }

    const toEmails = [...new Set(contacts.map((c: any) => c.email).filter(Boolean))]

    if (!RESEND_API_KEY) {
      throw new Error(
        'Chave de API do Resend (RESEND_API_KEY) não configurada no servidor Supabase. Configure-a para habilitar o envio de e-mails.',
      )
    }

    // HTML Template Builder
    const answersHtml = (inspection.answers || [])
      .map((a: any) => {
        const bgColor = a.status === 'NC' ? '#fef2f2' : '#f8fafc'
        const borderColor = a.status === 'NC' ? '#ef4444' : a.status === 'C' ? '#22c55e' : '#cbd5e1'
        const statusText =
          a.status === 'C' ? 'Conforme' : a.status === 'NC' ? 'Não Conforme' : 'N/A'

        return `
        <div style="margin-bottom: 15px; padding: 15px; border-radius: 6px; background-color: ${bgColor}; border-left: 4px solid ${borderColor};">
          <div style="font-weight: bold; margin-bottom: 5px;">${a.itemName || `Item ID: ${a.itemId}`}</div>
          <div>Status: <strong>${statusText}</strong></div>
          ${a.status === 'NC' && a.justification ? `<div style="margin-top: 10px; color: #b91c1c;"><strong>Justificativa:</strong> ${a.justification}</div>` : ''}
          ${a.photo ? `<div style="margin-top: 10px; font-size: 12px; color: #64748b;">(Foto de evidência anexada ao e-mail)</div>` : ''}
        </div>
      `
      })
      .join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Nowavet Agro</h1>
          <p style="margin: 5px 0 0 0; color: #94a3b8;">Relatório de Inspeção de Estrutura</p>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">Detalhes da Inspeção</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Instalação:</strong></td><td style="text-align: right;">${inspection.structure || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Tipo:</strong></td><td style="text-align: right;">${inspection.type || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Inspetor:</strong></td><td style="text-align: right;">${inspection.inspector || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Data:</strong></td><td style="text-align: right;">${new Date(inspection.date).toLocaleString('pt-BR')}</td></tr>
          </table>

          <h2 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Resultados do Checklist</h2>
          ${answersHtml}
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          Este é um e-mail automático do Sistema de Inspeção Nowavet.<br/>
          As fotos de evidência encontram-se como anexos neste e-mail.
        </div>
      </div>
    `

    // Extract base64 attachments
    const attachments = []
    let attachmentIndex = 1
    for (const answer of inspection.answers || []) {
      if (answer.photo && answer.photo.startsWith('data:image')) {
        const base64Data = answer.photo.split(',')[1]
        let extension = 'jpg'
        if (answer.photo.includes('image/png')) extension = 'png'
        if (answer.photo.includes('image/jpeg')) extension = 'jpg'

        const itemNameSlug = (answer.itemName || answer.itemId)
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .slice(0, 20)

        attachments.push({
          filename: `evidencia_${attachmentIndex}_${itemNameSlug}.${extension}`,
          content: base64Data,
        })
        attachmentIndex++
      }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Nowavet Inspeções <onboarding@resend.dev>', // Usar domínio verificado caso tenha
        to: toEmails,
        subject: `[Nowavet] Relatório de Inspeção - ${inspection.structure}`,
        html: html,
        attachments: attachments,
      }),
    })

    if (!res.ok) {
      const errData = await res.text()
      let errMsg = errData
      try {
        const parsed = JSON.parse(errData)
        errMsg = parsed.message || parsed.error || errData
      } catch (e) {}
      throw new Error(`Falha na API do provedor de e-mail: ${errMsg}`)
    }

    const resData = await res.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório processado e enviado com sucesso.',
        id: resData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('[EDGE FUNCTION ERROR]', err.message)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
