routerAdd('POST', '/backend/v1/auth/webauthn/auth/verify', (e) => {
  var body = e.requestInfo().body || {}
  var credentialId = body.credentialId
  var userHandle = body.userHandle

  if (!credentialId) return e.badRequestError('credentialId is required')
  if (!userHandle) return e.badRequestError('userHandle is required')

  var passkey = null
  try {
    passkey = $app.findFirstRecordByFilter('passkeys', 'credential_id = "' + credentialId + '"')
  } catch (_) {
    return e.unauthorizedError('Invalid credential')
  }

  var passkeyUserId = passkey.getString('user_id')
  if (passkeyUserId !== userHandle) {
    return e.unauthorizedError('User mismatch')
  }

  var user = null
  try {
    user = $app.findRecordById('users', userHandle)
  } catch (_) {
    return e.unauthorizedError('User not found')
  }

  if (user.getBool('active') === false) {
    return e.unauthorizedError('User is inactive')
  }

  return $apis.recordAuthResponse(e, user)
})
