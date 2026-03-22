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
import { Edit, Trash2, Plus } from 'lucide-react'
import { Facility } from '@/lib/types'
import { toast } from 'sonner'

export function FacilitiesManager() {
  const { facilities, setFacilities } = useAppContext()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const openDialog = (f?: Facility) => {
    if (f) {
      setEditing(f)
      setName(f.name)
      setDescription(f.description)
    } else {
      setEditing(null)
      setName('')
      setDescription('')
    }
    setOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) return toast.error('Nome é obrigatório')

    if (editing) {
      setFacilities(facilities.map((f) => (f.id === editing.id ? { ...f, name, description } : f)))
      toast.success('Instalação atualizada')
    } else {
      setFacilities([
        ...facilities,
        { id: Math.random().toString(36).substring(2), name, description },
      ])
      toast.success('Instalação criada')
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta instalação?')) {
      setFacilities(facilities.filter((f) => f.id !== id))
      toast.success('Instalação removida')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Instalações / Estruturas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Nova Instalação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Instalação' : 'Nova Instalação'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Estrutura *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Galpão Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição / Localização</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Área Norte"
                />
              </div>
              <Button className="w-full" onClick={handleSave}>
                Salvar Instalação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Nenhuma instalação cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(f)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
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
