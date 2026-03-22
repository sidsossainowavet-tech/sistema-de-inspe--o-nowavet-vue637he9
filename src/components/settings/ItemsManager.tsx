import { useState } from 'react'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Edit, Trash2, Plus } from 'lucide-react'
import { ChecklistItem } from '@/lib/types'
import { toast } from 'sonner'

export function ItemsManager() {
  const { items, setItems } = useAppContext()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ChecklistItem | null>(null)

  const [name, setName] = useState('')
  const [mandatory, setMandatory] = useState(true)
  const [active, setActive] = useState(true)

  const openDialog = (item?: ChecklistItem) => {
    if (item) {
      setEditing(item)
      setName(item.name)
      setMandatory(item.mandatory ?? true)
      setActive(item.active)
    } else {
      setEditing(null)
      setName('')
      setMandatory(true)
      setActive(true)
    }
    setOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) return toast.error('Nome é obrigatório')

    if (editing) {
      setItems(items.map((i) => (i.id === editing.id ? { ...i, name, mandatory, active } : i)))
      toast.success('Item atualizado')
    } else {
      setItems([...items, { id: Math.random().toString(36).substring(2), name, mandatory, active }])
      toast.success('Item criado')
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      setItems(items.filter((i) => i.id !== id))
      toast.success('Item removido')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Itens de Inspeção</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição do Item</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Obrigatório na Inspeção</Label>
                <Switch checked={mandatory} onCheckedChange={setMandatory} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
              <Button className="w-full" onClick={handleSave}>
                Salvar Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhum item cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.mandatory !== false ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{item.active ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
