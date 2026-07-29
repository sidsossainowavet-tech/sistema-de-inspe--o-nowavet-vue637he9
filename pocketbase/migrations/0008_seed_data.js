migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'sidimossai@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(users)
      record.setEmail('sidimossai@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Sidimar Sossai')
      record.set('role', 'admin')
      record.set('active', true)
      app.save(record)
    }

    let contactId = ''
    try {
      const c = app.findFirstRecordByData('contacts', 'name', 'João Pereira')
      contactId = c.id
    } catch (_) {
      const col = app.findCollectionByNameOrId('contacts')
      const r = new Record(col)
      r.set('name', 'João Pereira')
      r.set('phone', '5511999999999')
      r.set('email', 'joao.pereira@nowavet.com')
      r.set('role', 'Gerente')
      app.save(r)
      contactId = r.id
    }

    let evaluatorId = ''
    try {
      const e = app.findFirstRecordByData('evaluators', 'name', 'Carlos Silva')
      evaluatorId = e.id
    } catch (_) {
      const col = app.findCollectionByNameOrId('evaluators')
      const r = new Record(col)
      r.set('name', 'Carlos Silva')
      r.set('email', 'carlos.silva@nowavet.com')
      r.set('phone', '5511988887777')
      app.save(r)
      evaluatorId = r.id
    }

    let facilityId = ''
    try {
      const f = app.findFirstRecordByData('facilities', 'name', 'Fazenda Boa Vista')
      facilityId = f.id
    } catch (_) {
      const col = app.findCollectionByNameOrId('facilities')
      const r = new Record(col)
      r.set('name', 'Fazenda Boa Vista')
      r.set('address', 'Rodovia BR-101, km 200')
      r.set('city', 'Vitória')
      r.set('state', 'ES')
      r.set('description', 'Centro experimental principal')
      r.set('frequency_days', 7)
      r.set('category', 'Agropecuária')
      if (contactId) r.set('contact_id', contactId)
      app.save(r)
      facilityId = r.id
    }

    let inspectionId = ''
    try {
      const list = app.findRecordsByFilter(
        'inspections',
        'structure = "Fazenda Boa Vista"',
        '-created',
        1,
        0,
      )
      if (list.length > 0) inspectionId = list[0].id
    } catch (_) {}

    if (!inspectionId) {
      const col = app.findCollectionByNameOrId('inspections')
      const r = new Record(col)
      r.set('facility_id', facilityId)
      r.set('evaluator_id', evaluatorId)
      r.set('date', new Date().toISOString())
      r.set('status', 'pending')
      r.set('type', 'Check-in')
      r.set('structure', 'Fazenda Boa Vista')
      r.set('inspector', 'Carlos Silva')
      r.set('answers', [])
      app.save(r)
      inspectionId = r.id
    }

    try {
      app.findFirstRecordByData('items', 'name', 'Portões e Fechaduras')
    } catch (_) {
      const col = app.findCollectionByNameOrId('items')
      const r = new Record(col)
      r.set('inspection_id', inspectionId)
      r.set('name', 'Portões e Fechaduras')
      r.set('status', 'needs_review')
      app.save(r)
    }

    var checklistItems = [
      { name: 'Portões e Fechaduras', active: true, mandatory: true },
      { name: 'Iluminação Interna/Externa', active: true, mandatory: true },
      { name: 'Bebedouros e Comedouros', active: true, mandatory: true },
      { name: 'Estrutura do Telhado', active: true, mandatory: true },
      { name: 'Pisos e Drenagem', active: true, mandatory: true },
    ]

    for (var i = 0; i < checklistItems.length; i++) {
      var item = checklistItems[i]
      try {
        app.findFirstRecordByData('checklist_items', 'name', item.name)
      } catch (_) {
        var col = app.findCollectionByNameOrId('checklist_items')
        var r = new Record(col)
        r.set('name', item.name)
        r.set('active', item.active)
        r.set('mandatory', item.mandatory)
        app.save(r)
      }
    }
  },
  (app) => {
    try {
      var r = app.findAuthRecordByEmail('_pb_users_auth_', 'sidimossai@gmail.com')
      app.delete(r)
    } catch (_) {}
  },
)
