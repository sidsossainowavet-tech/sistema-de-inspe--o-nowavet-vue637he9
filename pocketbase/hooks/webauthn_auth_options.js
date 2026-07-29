routerAdd('GET', '/backend/v1/auth/webauthn/auth/options', (e) => {
  var challenge = $security.randomString(32)

  var siteUrl = $secrets.get('SITE_URL') || 'https://inspecoes.goskip.app'
  var rpId = siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0]

  return e.json(200, {
    challenge: challenge,
    rpId: rpId,
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: [],
  })
})
