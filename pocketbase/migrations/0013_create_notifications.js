migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const facilitiesId = app.findCollectionByNameOrId('facilities').id
    const collection = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: usersId, maxSelect: 1 },
        {
          name: 'facility_id',
          type: 'relation',
          required: true,
          collectionId: facilitiesId,
          maxSelect: 1,
        },
        { name: 'type', type: 'select', values: ['missed_inspection'], maxSelect: 1 },
        { name: 'message', type: 'text' },
        { name: 'read', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_user_id ON notifications (user_id)',
        'CREATE INDEX idx_notifications_read ON notifications (read)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('notifications')
      app.delete(col)
    } catch (_) {}
  },
)
