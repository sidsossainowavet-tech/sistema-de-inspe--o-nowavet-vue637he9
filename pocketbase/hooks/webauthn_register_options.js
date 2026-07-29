routerAdd(
  'GET',
  '/backend/v1/auth/webauthn/register/options',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var user = $app.findRecordById('users', userId)
    var challenge = $security.randomString(32)

    user.set('webauthn_challenge', challenge)
    $app.save(user)

    var excludeCredentials = []
    try {
      var passkeys = $app.findRecordsByFilter('passkeys', 'user_id = "' + userId + '"', '', 0, 0)
      for (var i = 0; i < passkeys.length; i++) {
        excludeCredentials.push({ type: 'public-key', id: passkeys[i].getString('credential_id') })
      }
    } catch (_) {}

    var siteUrl = $secrets.get('SITE_URL') || 'https://inspecoes.goskip.app'
    var rpId = siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0]

    return e.json(200, {
      challenge: challenge,
      rp: { name: 'Nowavet Agro', id: rpId },
      user: {
        id: userId,
        name: user.getString('email'),
        displayName: user.getString('name') || user.getString('email'),
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      timeout: 60000,
      attestation: 'none',
      excludeCredentials: excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
    })
  },
  $apis.requireAuth(),
)
