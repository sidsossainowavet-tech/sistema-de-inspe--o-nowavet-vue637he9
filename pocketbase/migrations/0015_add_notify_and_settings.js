migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('notify')) {
      usersCol.fields.add(new BoolField({ name: 'notify' }))
    }
    app.save(usersCol)

    var settingsCol = new Collection({
      name: 'settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
    })
    app.save(settingsCol)

    try {
      app.findFirstRecordByData('settings', 'key', 'notification_email')
    } catch (_) {
      var col = app.findCollectionByNameOrId('settings')
      var rec = new Record(col)
      rec.set('key', 'notification_email')
      rec.set('value', 'sidimarsossai@nowavet.com.br')
      app.save(rec)
    }

    try {
      app.findFirstRecordByData('settings', 'key', 'notification_email')
    } catch (_) {}
  },
  (app) => {
    try {
      var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      var field = usersCol.fields.getByName('notify')
      if (field) {
        usersCol.fields.remove(field)
        app.save(usersCol)
      }
    } catch (_) {}

    try {
      var settingsCol = app.findCollectionByNameOrId('settings')
      app.delete(settingsCol)
    } catch (_) {}
  },
)
