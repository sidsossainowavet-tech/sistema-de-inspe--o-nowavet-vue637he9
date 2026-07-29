export const SystemLogger = {
  logAudit: async (userEmail: string, action: string, details?: any) => {
    console.log('[AUDIT]', userEmail, action, details || {})
  },
  logError: async (
    userEmail: string | null,
    context: string,
    errorMessage: string,
    details?: any,
  ) => {
    console.error('[ERROR]', userEmail || 'Sistema', context, errorMessage, details || {})
  },
}
