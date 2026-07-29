migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'sidimarsossai@gmail.com')
      return
    } catch (_) {}

    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'sidimossai@gmail.com')
      record.setEmail('sidimarsossai@gmail.com')
      record.set('role', 'admin')
      record.set('active', true)
      record.set('name', 'Sidimar Sossai')
      app.save(record)
      return
    } catch (_) {}

    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'sidsossai.nowavet@gmail.com')
      record.setEmail('sidimarsossai@gmail.com')
      record.set('role', 'admin')
      record.set('active', true)
      record.set('name', 'Sidimar Sossai')
      app.save(record)
      return
    } catch (_) {}

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const record = new Record(users)
    record.setEmail('sidimarsossai@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Sidimar Sossai')
    record.set('role', 'admin')
    record.set('active', true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'sidimarsossai@gmail.com')
      record.setEmail('sidimossai@gmail.com')
      app.save(record)
    } catch (_) {}
  },
)
