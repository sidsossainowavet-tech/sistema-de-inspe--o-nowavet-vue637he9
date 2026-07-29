import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Leaf, Loader2, Shield } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated, isCheckingSession } = useAppContext()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Preencha todos os campos.')
      return
    }

    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)

    if (result.success) {
      toast.success('Login efetuado com sucesso!')
      navigate('/')
    } else {
      toast.error(result.message || 'Credenciais inválidas.')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-8 flex flex-col items-center z-10">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg mb-4 transform -rotate-6 transition-transform hover:rotate-0 duration-300">
          <Leaf className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Nowavet Agro</h1>
        <p className="text-muted-foreground font-medium mt-1">Sistema de Inspeções Estruturais</p>
      </div>

      <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary z-10 bg-background/80 backdrop-blur-sm">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl">Acesso Restrito</CardTitle>
          <CardDescription>Insira suas credenciais para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@nowavet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-background shadow-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full shadow-elevation py-6 text-base font-medium transition-all active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Sistema'}
            </Button>

            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-6 pt-4 border-t">
              <Shield className="w-3 h-3 text-primary" /> Protegido por PocketBase Auth
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
