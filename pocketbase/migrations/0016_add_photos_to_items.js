migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('items')
    if (!col.fields.getByName('photos')) {
      col.fields.add(
        new FileField({
          name: 'photos',
          maxSelect: 5,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('items')
      const field = col.fields.getByName('photos')
      if (field) {
        col.fields.remove(field)
        app.save(col)
      }
    } catch (_) {}
  },
)
