import { Outlet } from 'react-router-dom'
import { TopHeader } from './TopHeader'
import { DesktopSidebar, BottomNav } from './Navigation'

export default function Layout() {
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
