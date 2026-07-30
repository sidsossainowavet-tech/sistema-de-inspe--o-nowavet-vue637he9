routerAdd(
  'POST',
  '/backend/v1/inspections/{id}/clear-photos',
  (e) => {
    var inspectionId = e.request.pathValue('id')

    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Apenas administradores podem limpar fotos.')
    }

    var items = $app.findRecordsByFilter(
      'items',
      'inspection_id = "' + inspectionId + '"',
      'created',
      100,
      0,
    )

    var fsys = $app.newFilesystem()
    var deleted = 0
    try {
      var logCol = null
      try {
        logCol = $app.findCollectionByNameOrId('photo_send_log')
      } catch (_) {}

      for (var i = 0; i < items.length; i++) {
        var item = items[i]
        var photos = item.get('photos') || []
        if (photos.length === 0) continue

        for (var j = 0; j < photos.length; j++) {
          try {
            var key = item.baseFilesPath() + '/' + photos[j]
            if (fsys.exists(key)) fsys.delete(key)
          } catch (_) {}
        }

        item.set('photos', [])
        item.set('sent_at', new Date().toISOString())
        $app.save(item)
        deleted += photos.length

        if (logCol) {
          try {
            var lr = new Record(logCol)
            lr.set('item_id', item.id)
            lr.set('inspection_id', inspectionId)
            lr.set('sent_at', new Date().toISOString())
            lr.set('photos_deleted', true)
            lr.set('method', 'manual')
            $app.save(lr)
          } catch (_) {}
        }
      }
    } finally {
      fsys.close()
    }

    return e.json(200, {
      success: true,
      message: deleted + ' fotos removidas.',
    })
  },
  $apis.requireAuth(),
)
