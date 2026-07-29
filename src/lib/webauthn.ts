import pb from '@/lib/pocketbase/client'

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof navigator.credentials !== 'undefined'
  )
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function registerPasskey(): Promise<boolean> {
  const options = await pb.send('/backend/v1/auth/webauthn/register/options', { method: 'GET' })

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: new TextEncoder().encode(options.challenge),
    rp: options.rp,
    user: {
      id: new TextEncoder().encode(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    } as PublicKeyCredentialUserEntity,
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation as AttestationConveyancePreference,
    excludeCredentials: (options.excludeCredentials || []).map((c: any) => ({
      type: c.type,
      id: base64ToArrayBuffer(c.id),
    })),
    authenticatorSelection: options.authenticatorSelection,
  }

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential
  if (!credential) throw new Error('Falha ao criar credencial.')

  const response = credential.response as AuthenticatorAttestationResponse
  const transports = response.getTransports ? response.getTransports() : []

  await pb.send('/backend/v1/auth/webauthn/register/verify', {
    method: 'POST',
    body: JSON.stringify({
      credentialId: credential.id,
      publicKey: '',
      transports,
    }),
    headers: { 'Content-Type': 'application/json' },
  })

  return true
}

export async function authenticateWithPasskey(): Promise<boolean> {
  const options = await pb.send('/backend/v1/auth/webauthn/auth/options', { method: 'GET' })

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: new TextEncoder().encode(options.challenge),
    rpId: options.rpId,
    timeout: options.timeout,
    userVerification: options.userVerification as UserVerificationRequirement,
    allowCredentials: [],
  }

  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential
  if (!credential) throw new Error('Falha na autenticacao.')

  const response = credential.response as AuthenticatorAssertionResponse
  const userHandle = response.userHandle ? new TextDecoder().decode(response.userHandle) : ''

  const result = await pb.send('/backend/v1/auth/webauthn/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      credentialId: credential.id,
      userHandle,
    }),
    headers: { 'Content-Type': 'application/json' },
  })

  pb.authStore.save(result.token, result.record)
  return true
}
