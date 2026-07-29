import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react'
import { ChecklistItem } from '@/lib/types'
import { toast } from 'sonner'
import {
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/services/checklist-items'
import { useRealtime } from '@/hooks/use-realtime'

const MAX_ITEMS = 50
const MAX_NAME_LENGTH = 600

export function ItemsManager() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ChecklistItem | null>(null)
  const [name, setName] = useState('')
  const [mandatory, setMandatory] = useState(true)
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadItems = async () => {
    try {
      const data = await getChecklistItems()
      setItems(data)
    } catch (e) {
      console.error('Failed to load items', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])
  useRealtime('checklist_items', () => {
    loadItems()
  })

  const atLimit = items.length >= MAX_ITEMS

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

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nome é obrigatório')
    if (name.length > MAX_NAME_LENGTH)
      return toast.error(`Nome não pode exceder ${MAX_NAME_LENGTH} caracteres`)
    setSaving(true)
    try {
      if (editing) {
        await updateChecklistItem(editing.id, { name, mandatory, active })
        toast.success('Pergunta atualizada')
      } else {
        await createChecklistItem({ name, mandatory, active })
        toast.success('Pergunta criada')
      }
      setOpen(false)
      loadItems()
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta pergunta?')) return
    try {
      await deleteChecklistItem(id)
      toast.success('Pergunta removida')
      loadItems()
    } catch (e: any) {
      toast.error('Erro ao excluir: ' + e.message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Perguntas do Checklist</CardTitle>
        <div className="flex items-center gap-3">
          {atLimit && (
            <span className="text-sm text-destructive font-medium">
              Limite de 50 perguntas atingido
            </span>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={atLimit} onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Nova Pergunta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Descrição da Pergunta *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={MAX_NAME_LENGTH}
                  />
                  <p className="text-xs text-muted-foreground">
                    {name.length}/{MAX_NAME_LENGTH} caracteres
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Obrigatório na Inspeção</Label>
                  <Switch checked={mandatory} onCheckedChange={setMandatory} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={active} onCheckedChange={setActive} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Pergunta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhuma pergunta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.mandatory !== false ? 'default' : 'secondary'}>
                        {item.mandatory !== false ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.active ? 'default' : 'secondary'}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
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
        )}
      </CardContent>
    </Card>
  )
}
