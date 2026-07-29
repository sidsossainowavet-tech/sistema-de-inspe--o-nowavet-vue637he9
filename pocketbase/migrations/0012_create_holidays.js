migrate(
  (app) => {
    const collection = new Collection({
      name: 'holidays',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'name', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_holidays_date ON holidays (date)'],
    })
    app.save(collection)

    var holidays = [
      { date: '2026-01-01', name: 'Confraternizacao Universal' },
      { date: '2026-02-17', name: 'Carnaval' },
      { date: '2026-02-18', name: 'Carnaval' },
      { date: '2026-04-03', name: 'Sexta-feira Santa' },
      { date: '2026-04-21', name: 'Tiradentes' },
      { date: '2026-05-01', name: 'Dia do Trabalho' },
      { date: '2026-06-04', name: 'Corpus Christi' },
      { date: '2026-09-07', name: 'Independencia do Brasil' },
      { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
      { date: '2026-11-02', name: 'Finados' },
      { date: '2026-11-15', name: 'Proclamacao da Republica' },
      { date: '2026-12-25', name: 'Natal' },
    ]

    for (var i = 0; i < holidays.length; i++) {
      var h = holidays[i]
      try {
        app.findFirstRecordByData('holidays', 'date', h.date)
      } catch (_) {
        var col = app.findCollectionByNameOrId('holidays')
        var r = new Record(col)
        r.set('date', h.date)
        r.set('name', h.name)
        app.save(r)
      }
    }
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('holidays')
      app.delete(col)
    } catch (_) {}
  },
)
