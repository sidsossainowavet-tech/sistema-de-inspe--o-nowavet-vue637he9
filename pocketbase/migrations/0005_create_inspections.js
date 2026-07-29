migrate(
  (app) => {
    const facilitiesId = app.findCollectionByNameOrId('facilities').id
    const evaluatorsId = app.findCollectionByNameOrId('evaluators').id
    const collection = new Collection({
      name: 'inspections',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'facility_id',
          type: 'relation',
          required: true,
          collectionId: facilitiesId,
          maxSelect: 1,
        },
        {
          name: 'evaluator_id',
          type: 'relation',
          required: true,
          collectionId: evaluatorsId,
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'completed', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 20,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'type', type: 'text' },
        { name: 'structure', type: 'text' },
        { name: 'inspector', type: 'text' },
        { name: 'start_time', type: 'date' },
        { name: 'end_time', type: 'date' },
        { name: 'duration_seconds', type: 'number', onlyInt: true },
        { name: 'answers', type: 'json', maxSize: 10485760 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_inspections_facility_id ON inspections (facility_id)',
        'CREATE INDEX idx_inspections_evaluator_id ON inspections (evaluator_id)',
        'CREATE INDEX idx_inspections_status ON inspections (status)',
        'CREATE INDEX idx_inspections_date ON inspections (date)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('inspections')
    app.delete(collection)
  },
)
