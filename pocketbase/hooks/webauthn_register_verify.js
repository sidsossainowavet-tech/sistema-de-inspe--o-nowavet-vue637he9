routerAdd(
  'POST',
  '/backend/v1/auth/webauthn/register/verify',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var body = e.requestInfo().body || {}
    if (!body.credentialId) return e.badRequestError('credentialId is required')

    try {
      $app.findFirstRecordByFilter('passkeys', 'credential_id = "' + body.credentialId + '"')
      return e.json(200, { success: true, message: 'Credential already registered' })
    } catch (_) {}

    var col = $app.findCollectionByNameOrId('passkeys')
    var record = new Record(col)
    record.set('user_id', userId)
    record.set('credential_id', body.credentialId)
    record.set('public_key', body.publicKey || '')
    record.set('transports', body.transports || [])
    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
