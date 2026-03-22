import { useState } from 'react'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Evaluator } from '@/lib/types'
import { toast } from 'sonner'

export function EvaluatorsManager() {
  const { evaluators, setEvaluators } = useAppContext()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Evaluator | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')

  const openDialog = (e?: Evaluator) => {
    if (e) {
      setEditing(e)
      setName(e.name)
      setEmail(e.email)
      setPhone(e.phone)
      setAvatar(e.avatar)
    } else {
      setEditing(null)
      setName('')
      setEmail('')
      setPhone('')
      setAvatar(
        `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${Math.floor(Math.random() * 100)}`,
      )
    }
    setOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) return toast.error('Nome é obrigatório')

    if (editing) {
      setEvaluators(
        evaluators.map((e) => (e.id === editing.id ? { ...e, name, email, phone, avatar } : e)),
      )
      toast.success('Avaliador atualizado')
    } else {
      setEvaluators([
        ...evaluators,
        { id: Math.random().toString(36).substring(2), name, email, phone, avatar },
      ])
      toast.success('Avaliador criado')
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este avaliador?')) {
      setEvaluators(evaluators.filter((e) => e.id !== id))
      toast.success('Avaliador removido')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Avaliadores</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Novo Avaliador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Avaliador' : 'Novo Avaliador'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{name.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>URL da Foto (opcional)</Label>
                <Input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button className="w-full" onClick={handleSave}>
                Salvar Avaliador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perfil</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Nenhum avaliador cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              evaluators.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={e.avatar} />
                        <AvatarFallback>{e.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{e.email}</div>
                      <div className="text-muted-foreground">{e.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(e)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
