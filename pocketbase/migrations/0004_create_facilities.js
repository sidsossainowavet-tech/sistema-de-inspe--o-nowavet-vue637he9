migrate(
  (app) => {
    const contactsId = app.findCollectionByNameOrId('contacts').id
    const collection = new Collection({
      name: 'facilities',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'address', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'contact_id', type: 'relation', collectionId: contactsId, maxSelect: 1 },
        { name: 'description', type: 'text' },
        { name: 'frequency_days', type: 'number', onlyInt: true },
        { name: 'category', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_facilities_contact_id ON facilities (contact_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('facilities')
    app.delete(collection)
  },
)
