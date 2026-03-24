import { useState } from 'react'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit, ShieldAlert, Shield, UserPlus, Loader2, Cloud } from 'lucide-react'
import { UserAccount } from '@/lib/types'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

export default function UsersManagement() {
  const { users, setUsers, profile, isSyncing } = useAppContext()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'evaluator'>('evaluator')

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const openDialog = (u?: UserAccount) => {
    if (u) {
      setEditing(u)
      setName(u.name)
      setEmail(u.email)
      setPassword(u.password || '')
      setRole(u.role)
    } else {
      setEditing(null)
      setName('')
      setEmail('')
      setPassword('')
      setRole('evaluator')
    }
    setOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || (!editing && !password.trim())) {
      return toast.error('Preencha todos os campos obrigatórios.')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return toast.error('E-mail inválido.')
    }

    if (users.some((u) => u.email === email && u.id !== editing?.id)) {
      return toast.error('Este e-mail já está em uso por outro usuário.')
    }

    setIsLoading(true)
    try {
      if (editing) {
        await setUsers(
          users.map((u) =>
            u.id === editing.id ? { ...u, name, email, password: password || u.password, role } : u,
          ),
        )
        toast.success('Usuário atualizado com sucesso.')
      } else {
        await setUsers([
          ...users,
          {
            id: Math.random().toString(36).substring(2),
            name,
            email,
            password,
            role,
            active: true,
          },
        ])
        toast.success('Usuário criado com sucesso.')
      }
      setOpen(false)
    } catch (e) {
      toast.error('Erro ao salvar usuário.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStatus = async (user: UserAccount) => {
    if (user.email === profile.email) {
      return toast.error('Você não pode inativar sua própria conta.')
    }
    try {
      await setUsers(users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)))
      toast.success(`Usuário ${!user.active ? 'ativado' : 'inativado'} com sucesso.`)
    } catch (e) {
      toast.error('Erro ao atualizar status.')
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          Gestão de Equipe
        </h1>
        <p className="text-muted-foreground flex items-center gap-1 mt-1">
          <Cloud
            className={isSyncing ? 'w-4 h-4 text-accent animate-pulse' : 'w-4 h-4 text-primary'}
          />
          Conectado e sincronizado em tempo real via Skip Cloud
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Usuários Registrados</CardTitle>
            <CardDescription>Lista de todos os usuários com acesso ao sistema.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="gap-2">
                <UserPlus className="h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@nowavet.com"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {editing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha *'}
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="***"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso *</Label>
                  <Select
                    value={role}
                    onValueChange={(val: any) => setRole(val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                      <SelectItem value="evaluator">Avaliador (Apenas Inspeções)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-4" onClick={handleSave} disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="min-w-[200px]">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? (
                          <ShieldAlert className="w-3 h-3 mr-1" />
                        ) : (
                          <Shield className="w-3 h-3 mr-1" />
                        )}
                        {u.role === 'admin' ? 'Admin' : 'Avaliador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.active}
                          onCheckedChange={() => toggleStatus(u)}
                          disabled={u.email === profile.email}
                        />
                        <span
                          className={
                            u.active
                              ? 'text-green-600 text-sm font-medium'
                              : 'text-muted-foreground text-sm'
                          }
                        >
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(u)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
