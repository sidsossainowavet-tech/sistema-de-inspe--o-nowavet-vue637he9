migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('items')
    if (!col.fields.getByName('observations')) {
      col.fields.add(new TextField({ name: 'observations', max: 600 }))
    }
    app.save(col)
  },
  (app) => {},
)
