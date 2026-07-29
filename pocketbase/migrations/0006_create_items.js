migrate(
  (app) => {
    const inspectionsId = app.findCollectionByNameOrId('inspections').id
    const collection = new Collection({
      name: 'items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'inspection_id',
          type: 'relation',
          required: true,
          collectionId: inspectionsId,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['approved', 'disapproved', 'needs_review'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_items_inspection_id ON items (inspection_id)',
        'CREATE INDEX idx_items_status ON items (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('items')
    app.delete(collection)
  },
)
