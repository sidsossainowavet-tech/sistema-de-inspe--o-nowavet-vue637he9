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

  var notificationEmail = ''
  try {
    var settingsRec = $app.findFirstRecordByData('settings', 'key', 'notification_email')
    notificationEmail = settingsRec.getString('value')
  } catch (_) {}

  var notifyUsers = []
  try {
    notifyUsers = $app.findRecordsByFilter(
      'users',
      'notify = true && active = true',
      '-created',
      0,
      0,
    )
  } catch (_) {}

  var recipientEmails = []
  if (notificationEmail && notificationEmail.indexOf('@') !== -1) {
    recipientEmails.push(notificationEmail)
  }
  for (var n = 0; n < notifyUsers.length; n++) {
    var uEmail = notifyUsers[n].getString('email')
    if (uEmail && uEmail.indexOf('@') !== -1 && recipientEmails.indexOf(uEmail) === -1) {
      recipientEmails.push(uEmail)
    }
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
      var notifMessage =
        'A instalacao "' + facilityName + '" nao foi inspecionada hoje (' + todayDate + ').'

      try {
        var notifCol = $app.findCollectionByNameOrId('notifications')
        var notif = new Record(notifCol)
        notif.set('user_id', adminUser.id)
        notif.set('facility_id', facilityId)
        notif.set('type', 'missed_inspection')
        notif.set('message', notifMessage)
        notif.set('read', false)
        $app.save(notif)
      } catch (err) {
        $app.logger().error('Failed to create notification', 'facility', facilityId)
      }

      if (recipientEmails.length > 0) {
        var emailSubject = 'Inspeção não realizada – Alerta'
        var emailHtml =
          '<p>A instalação <strong>' +
          facilityName +
          '</strong> não foi inspecionada hoje (' +
          todayDate +
          ').</p>' +
          '<p><strong>Mensagem:</strong> ' +
          notifMessage +
          '</p>' +
          '<p>Por favor, realize a inspeção o mais breve possível.</p>'

        for (var r = 0; r < recipientEmails.length; r++) {
          try {
            $app.newMailClient().send({
              from: { name: 'Nowavet Inspecoes', address: 'noreply@nowavet.com' },
              to: [{ address: recipientEmails[r] }],
              subject: emailSubject,
              html: emailHtml,
            })
          } catch (mailErr) {
            $app
              .logger()
              .warn('Email sending failed or SMTP not configured', 'recipient', recipientEmails[r])
          }
        }
      }
    }
  }
})
