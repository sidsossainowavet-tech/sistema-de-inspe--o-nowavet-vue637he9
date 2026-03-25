import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL');
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');

// Fetch wrapper with automatic retry and detailed error extraction
async function fetchWithRetry(url: string, options: RequestInit, retries = 2) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      
      const text = await res.text();
      let parsedMsg = text;
      try {
        const json = JSON.parse(text);
        parsedMsg = json.message || json.error || JSON.stringify(json);
      } catch (e) {
        // keep text
      }
      throw new Error(`[Status ${res.status}] ${parsedMsg}`);
    } catch (e: any) {
      lastError = e;
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let emailSuccess = false;
  let emailError = null;
  let whatsappSuccess = false;
  let whatsappError = null;

  try {
    const body = await req.json();
    const inspection = body.inspection || {};
    let contacts = body.contacts || [];

    // Ensure central auditing email is always included
    if (!contacts.some((c: any) => c.email === 'auditoria.interna@nowavet.com.br')) {
       contacts.push({ 
         email: 'auditoria.interna@nowavet.com.br', 
         sector: 'Auditoria Interna',
         phone: '5511999999999' // mock fallback
       });
    }

    const toEmails = [...new Set(contacts.map((c: any) => c.email).filter(Boolean))];
    
    // Normalize phone numbers (strip non-digits, ensure country code 55 for Brazil)
    const rawPhones = contacts.map((c: any) => c.phone).filter(Boolean);
    const toPhones = [...new Set(rawPhones)].map((p: any) => {
      let nums = String(p).replace(/\D/g, '');
      if (nums.length === 10 || nums.length === 11) {
        nums = '55' + nums; // Append Brazilian DDI if missing
      }
      return nums;
    }).filter(p => p.length >= 12); // Must be at least 12 digits (55 + 10/11)

    // Formatted Text for WhatsApp
    const answersText = (inspection.answers || []).map((a: any) => {
      const statusText = a.status === 'C' ? '✅ Conforme' : (a.status === 'NC' ? '❌ Não Conforme' : '➖ N/A');
      return `*${a.itemName || a.itemId}*: ${statusText} ${a.status === 'NC' && a.justification ? `\n_Justificativa: ${a.justification}_` : ''}`;
    }).join('\n\n');

    const plainTextReport = `🚨 *Novo Relatório de Inspeção - Nowavet* 🚨\n\n` +
      `🏢 *Instalação:* ${inspection.structure || 'N/A'}\n` +
      `📋 *Tipo:* ${inspection.type || 'N/A'}\n` +
      `👤 *Inspetor:* ${inspection.inspector || 'N/A'}\n` +
      `📅 *Data:* ${new Date(inspection.date || Date.now()).toLocaleString('pt-BR')}\n\n` +
      `*Resultados do Checklist:*\n\n${answersText || '_Nenhum item preenchido._'}`;

    // HTML Template Builder for Email
    const answersHtml = (inspection.answers || []).map((a: any) => {
      const bgColor = a.status === 'NC' ? '#fef2f2' : '#f8fafc';
      const borderColor = a.status === 'NC' ? '#ef4444' : (a.status === 'C' ? '#22c55e' : '#cbd5e1');
      const statusText = a.status === 'C' ? 'Conforme' : (a.status === 'NC' ? 'Não Conforme' : 'N/A');
      
      return `
        <div style="margin-bottom: 15px; padding: 15px; border-radius: 6px; background-color: ${bgColor}; border-left: 4px solid ${borderColor};">
          <div style="font-weight: bold; margin-bottom: 5px;">${a.itemName || `Item ID: ${a.itemId}`}</div>
          <div>Status: <strong>${statusText}</strong></div>
          ${a.status === 'NC' && a.justification ? `<div style="margin-top: 10px; color: #b91c1c;"><strong>Justificativa:</strong> ${a.justification}</div>` : ''}
          ${a.photo ? `<div style="margin-top: 10px; font-size: 12px; color: #64748b;">(Foto de evidência anexada)</div>` : ''}
        </div>
      `;
    }).join('');

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
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Data:</strong></td><td style="text-align: right;">${new Date(inspection.date || Date.now()).toLocaleString('pt-BR')}</td></tr>
          </table>
          <h2 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Resultados do Checklist</h2>
          ${answersHtml || '<p>Nenhum item preenchido.</p>'}
        </div>
      </div>
    `;

    // Extract Base64 Photos
    const attachments = [];
    let attachmentIndex = 1;
    for (const answer of (inspection.answers || [])) {
      if (answer.photo && answer.photo.startsWith('data:image')) {
        const base64Data = answer.photo.split(',')[1];
        let extension = 'jpg';
        if (answer.photo.includes('image/png')) extension = 'png';
        const itemNameSlug = (answer.itemName || answer.itemId).replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 20);

        attachments.push({
          filename: `evidencia_${attachmentIndex}_${itemNameSlug}.${extension}`,
          content: base64Data,
          mimeType: `image/${extension}`
        });
        attachmentIndex++;
      }
    }

    // 1. Process Email via Resend
    if (RESEND_API_KEY) {
      try {
        await fetchWithRetry('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Nowavet Inspeções <onboarding@resend.dev>',
            to: toEmails,
            subject: `[Nowavet] Relatório de Inspeção - ${inspection.structure || 'Teste'}`,
            html: html,
            attachments: attachments.map(a => ({ filename: a.filename, content: a.content }))
          })
        });
        emailSuccess = true;
      } catch (err: any) {
        console.error('[EMAIL ERROR]', err);
        emailError = `Recusado pelo provedor de e-mail: ${err.message}`;
      }
    } else {
      emailError = 'Variável RESEND_API_KEY não configurada no servidor Supabase.';
    }

    // 2. Process WhatsApp via API
    if (WHATSAPP_API_URL && WHATSAPP_API_TOKEN) {
      try {
        for (const phone of toPhones) {
          // Send Text
          await fetchWithRetry(`${WHATSAPP_API_URL}/message/sendText`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'apikey': WHATSAPP_API_TOKEN },
             body: JSON.stringify({ number: phone, text: plainTextReport })
          });

          // Send Media Attachments
          for (const att of attachments) {
             await fetchWithRetry(`${WHATSAPP_API_URL}/message/sendMedia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': WHATSAPP_API_TOKEN },
                body: JSON.stringify({
                  number: phone,
                  mediaMessage: { mediatype: 'image', caption: att.filename, media: att.content }
                })
             });
          }
        }
        whatsappSuccess = true;
      } catch (err: any) {
        console.error('[WHATSAPP ERROR]', err);
        whatsappError = `Falha na API de WhatsApp: ${err.message}`;
      }
    } else {
      whatsappError = 'Integração de WhatsApp não configurada (ausentes WHATSAPP_API_URL e TOKEN). Simulação concluída.';
      whatsappSuccess = true; 
    }

    return new Response(JSON.stringify({ 
      success: true, // Return true to allow saving locally, but propagate errors
      emailSuccess,
      emailError,
      whatsappSuccess,
      whatsappError,
      message: 'Diagnóstico e processamento de integrações finalizado.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[EDGE FUNCTION CRITICAL ERROR]', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
