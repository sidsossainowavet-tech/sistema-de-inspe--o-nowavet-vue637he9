/* Main App Component - Handles routing */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/store/AppContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import NewInspection from './pages/NewInspection'
import QualityDashboard from './pages/QualityDashboard'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import PrintReport from './pages/PrintReport'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/inspecao/nova" element={<NewInspection />} />
            <Route path="/qualidade" element={<QualityDashboard />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          {/* Print Route without Layout */}
          <Route path="/inspecao/:id/relatorio" element={<PrintReport />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
