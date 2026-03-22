import { Link, useLocation } from 'react-router-dom'
import { Home, ClipboardCheck, Settings, User, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/inspecao/nova', label: 'Inspeção', icon: ClipboardCheck },
  { path: '/qualidade', label: 'Qualidade', icon: Activity },
  { path: '/configuracoes', label: 'Ajustes', icon: Settings },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export function DesktopSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar fixed left-0 top-16 bottom-0 z-30 print:hidden">
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-sidebar-accent',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background pb-safe print:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 rounded-md transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
