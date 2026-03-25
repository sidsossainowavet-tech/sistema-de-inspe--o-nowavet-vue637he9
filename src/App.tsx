import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/store/AppContext'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import NewInspection from './pages/NewInspection'
import QualityDashboard from './pages/QualityDashboard'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import UsersManagement from './pages/UsersManagement'
import PrintReport from './pages/PrintReport'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/inspecao/nova" element={<NewInspection />} />
              <Route path="/qualidade" element={<QualityDashboard />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/usuarios" element={<UsersManagement />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>
            {/* Print Route without Layout */}
            <Route path="/inspecao/:id/relatorio" element={<PrintReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
