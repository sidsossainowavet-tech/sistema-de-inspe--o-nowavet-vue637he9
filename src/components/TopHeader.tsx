import { useAppContext } from '@/store/AppContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export function TopHeader() {
  const { profile, isOnline, isSyncing } = useAppContext()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none text-primary">Nowavet</span>
            <span className="text-xs font-medium text-muted-foreground">Agro Inspeções</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-accent">
                <RefreshCw className="h-4 w-4 animate-spin-slow" /> Sincronizando
              </span>
            ) : isOnline ? (
              <span className="flex items-center gap-1 text-primary">
                <Wifi className="h-4 w-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive animate-pulse-soft">
                <WifiOff className="h-4 w-4" /> Offline
              </span>
            )}
          </div>
          <Avatar className="border-2 border-primary/10">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
