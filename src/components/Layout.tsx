import { Outlet, Navigate } from 'react-router-dom'
import { TopHeader } from './TopHeader'
import { DesktopSidebar, BottomNav } from './Navigation'
import { useAppContext } from '@/store/AppContext'
import { AlertCircle } from 'lucide-react'

export default function Layout() {
  const { profile, users, isAuthenticated } = useAppContext()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const currentUser = users?.find((u) => u.email === profile.email)
  const isUserActive = currentUser ? currentUser.active : true

  if (!isUserActive) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">Acesso Bloqueado</h1>
        <p className="text-muted-foreground max-w-md">
          Sua conta foi inativada. Você não tem mais permissão para acessar o sistema ou realizar
          ações. Por favor, contate o administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <TopHeader />
      <div className="flex flex-1">
        <DesktopSidebar />
        <main className="flex-1 md:ml-64 pb-16 md:pb-0 relative animate-fade-in print:ml-0 print:pb-0">
          <div className="container p-4 md:p-8 max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
