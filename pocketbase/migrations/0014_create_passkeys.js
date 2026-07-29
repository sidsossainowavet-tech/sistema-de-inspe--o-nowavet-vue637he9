migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const collection = new Collection({
      name: 'passkeys',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: usersId, maxSelect: 1 },
        { name: 'credential_id', type: 'text', required: true },
        { name: 'public_key', type: 'text' },
        { name: 'transports', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_passkeys_credential_id ON passkeys (credential_id)',
        'CREATE INDEX idx_passkeys_user_id ON passkeys (user_id)',
      ],
    })
    app.save(collection)

    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('webauthn_challenge')) {
      usersCol.fields.add(new TextField({ name: 'webauthn_challenge' }))
      app.save(usersCol)
    }
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('passkeys')
      app.delete(col)
    } catch (_) {}
  },
)
