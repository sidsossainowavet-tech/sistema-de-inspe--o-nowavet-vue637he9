import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Save, Mail, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '@/store/AppContext'
import { useRealtime } from '@/hooks/use-realtime'
import { getSetting, setSetting } from '@/services/settings'
import { updateUser } from '@/services/users'

export function NotificationConfig() {
  const { users, setUsers, profile } = useAppContext()
  const [email, setEmail] = useState('')
  const [isLoadingEmail, setIsLoadingEmail] = useState(true)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadEmail = useCallback(async () => {
    setIsLoadingEmail(true)
    try {
      const value = await getSetting('notification_email')
      setEmail(value)
    } catch {
      setEmail('')
    } finally {
      setIsLoadingEmail(false)
    }
  }, [])

  useEffect(() => {
    loadEmail()
  }, [loadEmail])

  useRealtime('settings', () => {
    loadEmail()
  })

  useRealtime('users', () => {
    loadEmail()
  })

  const handleSaveEmail = async () => {
    const trimmed = email.trim()
    if (trimmed && !trimmed.includes('@')) {
      toast.error('Email inválido. Verifique o endereço informado.')
      return
    }
    setIsSavingEmail(true)
    try {
      await setSetting('notification_email', trimmed)
      toast.success('Email de notificação salvo com sucesso.')
    } catch (e: any) {
      toast.error('Erro ao salvar email: ' + e.message)
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleToggleNotify = async (userId: string, current: boolean) => {
    setTogglingId(userId)
    try {
      await updateUser(userId, { notify: !current })
      await setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, notify: !current } : u)))
    } catch (e: any) {
      toast.error('Erro ao atualizar usuário: ' + e.message)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notificações de Inspeções Não Realizadas
        </CardTitle>
        <CardDescription>
          Configure o email de destino e selecione quais usuários recebem alertas de inspeções
          perdidas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email para notificações
          </Label>
          {isLoadingEmail ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sidimarsossai@nowavet.com.br"
                className="flex-1"
              />
              <Button onClick={handleSaveEmail} disabled={isSavingEmail} className="gap-2">
                {isSavingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Email
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Se deixado em branco, nenhum email será enviado (apenas notificações no app).
          </p>
        </div>

        <div className="border-t pt-6 space-y-3">
          <div>
            <h3 className="font-semibold text-base">Usuários que recebem notificações</h3>
            <p className="text-sm text-muted-foreground">
              Ative o toggle para cada usuário que deve receber alertas por email.
            </p>
          </div>
          {users.length === 0 ? (
            <div className="text-center p-6 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="divide-y">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {togglingId === u.id && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        checked={u.notify || false}
                        onCheckedChange={() => handleToggleNotify(u.id, u.notify || false)}
                        disabled={togglingId === u.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
