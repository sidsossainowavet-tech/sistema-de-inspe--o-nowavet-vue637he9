import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, BellOff } from 'lucide-react'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications'
import { useRealtime } from '@/hooks/use-realtime'
import { Notification } from '@/lib/types'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const { isAuthenticated, isCheckingSession } = useAppContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) loadNotifications()
  }, [isAuthenticated, loadNotifications])

  useRealtime('notifications', () => {
    loadNotifications()
  })

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await markNotificationAsRead(id)
    } catch {
      /* ignore */
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsAsRead()
      toast.success('Todas as notificações marcadas como lidas.')
    } catch {
      toast.error('Erro ao marcar notificações.')
      loadNotifications()
    }
  }

  if (isCheckingSession) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Bell className="w-7 h-7" /> Notificações
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma notificação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-70'}`}
              onClick={() => !n.read && handleMarkRead(n.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!n.read && (
                  <Badge variant="default" className="text-[10px]">
                    Nova
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
