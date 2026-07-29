migrate(
  (app) => {
    try {
      const old1 = app.findAuthRecordByEmail('_pb_users_auth_', 'sidimossai@gmail.com')
      app.delete(old1)
    } catch (_) {}

    try {
      const old2 = app.findAuthRecordByEmail('_pb_users_auth_', 'sidsossai.nowavet@gmail.com')
      app.delete(old2)
    } catch (_) {}

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'sidimarsossai@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Sidimar Sossai')
      user.set('role', 'admin')
      user.set('active', true)
      app.save(user)
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(users)
      record.setEmail('sidimarsossai@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Sidimar Sossai')
      record.set('role', 'admin')
      record.set('active', true)
      app.save(record)
    }
  },
  (app) => {},
)
