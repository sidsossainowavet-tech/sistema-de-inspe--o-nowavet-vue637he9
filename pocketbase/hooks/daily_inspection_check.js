cronAdd('daily_inspection_check', '0 8 * * *', () => {
  var today = new Date()
  var dayOfWeek = today.getDay()

  if (dayOfWeek === 0 || dayOfWeek === 6) return

  var yyyy = today.getFullYear()
  var mm = String(today.getMonth() + 1).padStart(2, '0')
  var dd = String(today.getDate()).padStart(2, '0')
  var todayDate = yyyy + '-' + mm + '-' + dd
  var todayStart = todayDate + ' 00:00:00'
  var todayEnd = todayDate + ' 23:59:59'

  var isHoliday = false
  try {
    $app.findFirstRecordByFilter(
      'holidays',
      'date >= "' + todayStart + '" && date <= "' + todayEnd + '"',
    )
    isHoliday = true
  } catch (_) {}
  if (isHoliday) return

  var adminUser = null
  try {
    adminUser = $app.findFirstRecordByFilter('users', 'role = "admin" && active = true')
  } catch (_) {
    $app.logger().warn('No admin user found for daily inspection check')
    return
  }

  var facilities = []
  try {
    facilities = $app.findRecordsByFilter('facilities', 'id != ""', '-created', 0, 0)
  } catch (_) {
    return
  }

  for (var i = 0; i < facilities.length; i++) {
    var facility = facilities[i]
    var facilityId = facility.id
    var facilityName = facility.getString('name')

    var hasInspectionToday = false
    try {
      $app.findFirstRecordByFilter(
        'inspections',
        'facility_id = "' +
          facilityId +
          '" && status = "completed" && date >= "' +
          todayStart +
          '" && date <= "' +
          todayEnd +
          '"',
      )
      hasInspectionToday = true
    } catch (_) {}

    if (!hasInspectionToday) {
      try {
        var notifCol = $app.findCollectionByNameOrId('notifications')
        var notif = new Record(notifCol)
        notif.set('user_id', adminUser.id)
        notif.set('facility_id', facilityId)
        notif.set('type', 'missed_inspection')
        notif.set(
          'message',
          'A instalacao "' + facilityName + '" nao foi inspecionada hoje (' + todayDate + ').',
        )
        notif.set('read', false)
        $app.save(notif)
      } catch (err) {
        $app.logger().error('Failed to create notification', 'facility', facilityId)
      }

      var emailTo = ''
      var contactId = facility.getString('contact_id')
      if (contactId) {
        try {
          var contact = $app.findRecordById('contacts', contactId)
          emailTo = contact.getString('email')
        } catch (_) {}
      }
      if (!emailTo) {
        emailTo = adminUser.getString('email')
      }

      if (emailTo) {
        try {
          $app.newMailClient().send({
            from: { name: 'Nowavet Inspecoes', address: 'noreply@nowavet.com' },
            to: [{ address: emailTo }],
            subject: 'Inspecao pendente: ' + facilityName,
            html:
              '<p>A instalacao <strong>' +
              facilityName +
              '</strong> nao foi inspecionada hoje (' +
              todayDate +
              ').</p><p>Por favor, realize a inspecao o mais breve possivel.</p>',
          })
        } catch (mailErr) {
          $app.logger().warn('Email sending failed or SMTP not configured')
        }
      }
    }
  }
})
