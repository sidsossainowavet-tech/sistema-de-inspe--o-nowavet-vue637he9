import { supabase } from '@/lib/supabase/client'

export const SystemLogger = {
  logAudit: async (userEmail: string, action: string, details?: any) => {
    if (!supabase) return
    try {
      await supabase.from('audit_logs').insert([
        {
          user_email: userEmail,
          action,
          details: details || {},
        },
      ])
    } catch (e) {
      console.error('Failed to log audit', e)
    }
  },
  logError: async (
    userEmail: string | null,
    context: string,
    errorMessage: string,
    details?: any,
  ) => {
    if (!supabase) return
    try {
      await supabase.from('error_logs').insert([
        {
          user_email: userEmail || 'Sistema',
          context,
          error_message: errorMessage,
          details: details || {},
        },
      ])
    } catch (e) {
      console.error('Failed to log error', e)
    }
  },
}
