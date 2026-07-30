routerAdd(
  'POST',
  '/backend/v1/inspections/{id}/send-report',
  (e) => {
    var inspectionId = e.request.pathValue('id')
    var body = e.requestInfo().body || {}
    var photosData = body.photos || {}

    var inspection = $app.findRecordById('inspections', inspectionId)
    var structure = inspection.getString('structure') || 'N/A'
    var insType = inspection.getString('type') || 'N/A'
    var inspector = inspection.getString('inspector') || 'N/A'
    var dateStr = inspection.getString('date') || new Date().toISOString()

    var items = $app.findRecordsByFilter(
      'items',
      'inspection_id = "' + inspectionId + '"',
      'created',
      100,
      0,
    )

    var recipients = []
    try {
      var s = $app.findFirstRecordByData('settings', 'key', 'notification_email')
      if (s.getString('value')) recipients.push(s.getString('value'))
    } catch (_) {}
    try {
      var nu = $app.findRecordsByFilter('users', 'notify = true', '', 100, 0)
      for (var i = 0; i < nu.length; i++) {
        var em = nu[i].getString('email')
        if (em && recipients.indexOf(em) === -1) recipients.push(em)
      }
    } catch (_) {}
    if (recipients.length === 0) return e.badRequestError('Nenhum destinatario configurado.')

    var apiKey = ''
    try {
      var ks = $app.findFirstRecordByData('settings', 'key', 'resend_api_key')
      apiKey = ks.getString('value')
    } catch (_) {}
    if (!apiKey)
      return e.badRequestError(
        "Chave Resend nao configurada. Adicione 'resend_api_key' nas configuracoes.",
      )

    var itemsHtml = ''
    var attachments = []
    for (var j = 0; j < items.length; j++) {
      var item = items[j]
      var st = item.getString('status') || ''
      var stTxt = st === 'approved' ? 'Conforme' : st === 'disapproved' ? 'Nao Conforme' : 'N/A'
      var bg = st === 'disapproved' ? '#fef2f2' : '#f8fafc'
      var bc = st === 'disapproved' ? '#ef4444' : st === 'approved' ? '#22c55e' : '#cbd5e1'
      itemsHtml +=
        '<div style="margin-bottom:15px;padding:15px;border-radius:6px;background:' +
        bg +
        ';border-left:4px solid ' +
        bc +
        ';"><div style="font-weight:bold;">' +
        item.getString('name') +
        '</div><div>Status: <strong>' +
        stTxt +
        '</strong></div>'
      var nt = item.getString('notes')
      if (nt)
        itemsHtml += '<div style="margin-top:10px;color:#b91c1c;">Justificativa: ' + nt + '</div>'
      itemsHtml += '</div>'

      var ip = photosData[item.id] || []
      for (var k = 0; k < ip.length; k++) {
        if (ip[k] && ip[k].indexOf(',') > -1) {
          var b64 = ip[k].split(',')[1]
          var ext = ip[k].indexOf('image/png') > -1 ? 'png' : 'jpg'
          var slug = item
            .getString('name')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .toLowerCase()
            .slice(0, 20)
          attachments.push({
            filename: 'evid_' + (k + 1) + '_' + slug + '.' + ext,
            content: b64,
          })
        }
      }
    }

    var html =
      '<div style="font-family:Arial;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;"><div style="background:#0f172a;color:#fff;padding:20px;text-align:center;"><h1 style="margin:0;">Nowavet Agro</h1><p style="color:#94a3b8;margin:5px 0 0;">Relatorio de Inspecao</p></div><div style="padding:20px;"><table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;"><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><strong>Instalacao:</strong></td><td style="text-align:right;">' +
      structure +
      '</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><strong>Tipo:</strong></td><td style="text-align:right;">' +
      insType +
      '</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><strong>Inspetor:</strong></td><td style="text-align:right;">' +
      inspector +
      '</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><strong>Data:</strong></td><td style="text-align:right;">' +
      new Date(dateStr).toLocaleString('pt-BR') +
      '</td></tr></table>' +
      itemsHtml +
      '</div></div>'

    var payload = {
      from: 'Nowavet <onboarding@resend.dev>',
      to: recipients,
      subject: 'Relatorio de Inspecao - ' + structure,
      html: html,
    }
    if (attachments.length > 0) payload.attachments = attachments

    var res
    try {
      res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify(payload),
        timeout: 30,
      })
    } catch (err) {
      return e.json(502, { error: 'Erro de conexao ao enviar email.' })
    }
    if (res.statusCode < 200 || res.statusCode >= 300)
      return e.json(res.statusCode, { error: 'Falha ao enviar email.' })

    var fsys = $app.newFilesystem()
    var deleted = 0
    try {
      var logCol = null
      try {
        logCol = $app.findCollectionByNameOrId('photo_send_log')
      } catch (_) {}
      for (var m = 0; m < items.length; m++) {
        var itm = items[m]
        if (!photosData[itm.id]) continue
        var ps = itm.get('photos') || []
        if (ps.length === 0) continue
        for (var n = 0; n < ps.length; n++) {
          try {
            var key = itm.baseFilesPath() + '/' + ps[n]
            if (fsys.exists(key)) fsys.delete(key)
          } catch (_) {}
        }
        itm.set('photos', [])
        itm.set('sent_at', new Date().toISOString())
        $app.save(itm)
        deleted += ps.length
        if (logCol) {
          try {
            var lr = new Record(logCol)
            lr.set('item_id', itm.id)
            lr.set('inspection_id', inspectionId)
            lr.set('sent_at', new Date().toISOString())
            lr.set('photos_deleted', true)
            lr.set('method', 'email')
            $app.save(lr)
          } catch (_) {}
        }
      }
    } finally {
      fsys.close()
    }

    return e.json(200, {
      success: true,
      message: 'Email enviado e ' + deleted + ' fotos removidas.',
      attachments: attachments.length,
    })
  },
  $apis.requireAuth(),
  $apis.bodyLimit(52428800),
)
