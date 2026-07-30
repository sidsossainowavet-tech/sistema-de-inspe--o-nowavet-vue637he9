migrate(
  (app) => {
    var itemsCol = app.findCollectionByNameOrId('items')
    if (!itemsCol.fields.getByName('sent_at')) {
      itemsCol.fields.add(new DateField({ name: 'sent_at' }))
    }
    app.save(itemsCol)

    var itemsId = app.findCollectionByNameOrId('items').id
    var inspectionsId = app.findCollectionByNameOrId('inspections').id

    var logCol = new Collection({
      name: 'photo_send_log',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'item_id',
          type: 'relation',
          required: true,
          collectionId: itemsId,
          maxSelect: 1,
        },
        {
          name: 'inspection_id',
          type: 'relation',
          required: true,
          collectionId: inspectionsId,
          maxSelect: 1,
        },
        { name: 'sent_at', type: 'date' },
        { name: 'photos_deleted', type: 'bool' },
        { name: 'method', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_photo_send_log_inspection_id ON photo_send_log (inspection_id)',
        'CREATE INDEX idx_photo_send_log_item_id ON photo_send_log (item_id)',
      ],
    })
    app.save(logCol)
  },
  (app) => {
    try {
      var itemsCol = app.findCollectionByNameOrId('items')
      var field = itemsCol.fields.getByName('sent_at')
      if (field) {
        itemsCol.fields.remove(field)
        app.save(itemsCol)
      }
    } catch (_) {}

    try {
      var logCol = app.findCollectionByNameOrId('photo_send_log')
      app.delete(logCol)
    } catch (_) {}
  },
)
