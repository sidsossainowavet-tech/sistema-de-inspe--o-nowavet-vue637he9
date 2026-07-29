import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Trash2, Plus, QrCode, Copy, Loader2 } from 'lucide-react'
import { Facility } from '@/lib/types'
import { toast } from 'sonner'
import {
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} from '@/services/facilities'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { FacilityBulkImport } from './FacilityBulkImport'

interface ContactOption {
  id: string
  name: string
}

export function FacilitiesManager() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)
  const [saving, setSaving] = useState(false)
  const [qrFacility, setQrFacility] = useState<Facility | null>(null)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    contactId: '',
    description: '',
    frequencyDays: '',
    category: '',
  })

  const loadFacilities = async () => {
    try {
      const data = await getFacilities()
      setFacilities(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const data = await pb.collection('contacts').getFullList({ sort: 'created' })
      setContacts(data.map((c: any) => ({ id: c.id, name: c.name || c.email || 'Sem nome' })))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadFacilities()
    loadContacts()
  }, [])
  useRealtime('facilities', () => {
    loadFacilities()
  })

  const openDialog = (f?: Facility) => {
    if (f) {
      setEditing(f)
      setForm({
        name: f.name,
        address: f.address || '',
        city: f.city || '',
        state: f.state || '',
        contactId: f.contactId || '',
        description: f.description || '',
        frequencyDays: f.frequencyDays?.toString() || '',
        category: f.category || '',
      })
    } else {
      setEditing(null)
      setForm({
        name: '',
        address: '',
        city: '',
        state: '',
        contactId: '',
        description: '',
        frequencyDays: '',
        category: '',
      })
    }
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    setSaving(true)
    const data: Partial<Facility> = {
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      contactId: form.contactId || undefined,
      description: form.description,
      frequencyDays: form.frequencyDays ? parseInt(form.frequencyDays) : undefined,
      category: form.category,
    }
    try {
      if (editing) {
        await updateFacility(editing.id, data)
        toast.success('Instalação atualizada')
      } else {
        await createFacility(data)
        toast.success('Instalação criada')
      }
      setOpen(false)
      loadFacilities()
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta instalação?')) return
    try {
      await deleteFacility(id)
      toast.success('Instalação removida')
      loadFacilities()
    } catch (e: any) {
      toast.error('Erro ao excluir: ' + e.message)
    }
  }

  const getQrUrl = (f: Facility) => `${window.location.origin}/inspecao/nova?facility=${f.id}`
  const getQrImageUrl = (f: Facility) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQrUrl(f))}`

  const handleCopyLink = (f: Facility) => {
    navigator.clipboard.writeText(getQrUrl(f))
    toast.success('Link copiado para a área de transferência')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Instalações / Estruturas</CardTitle>
        <div className="flex gap-2">
          <FacilityBulkImport />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Nova Instalação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Instalação' : 'Nova Instalação'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <Label>Nome da Estrutura *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Endereço</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Contato</Label>
                    <Select
                      value={form.contactId}
                      onValueChange={(v) => setForm({ ...form, contactId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frequência (dias)</Label>
                    <Input
                      type="number"
                      value={form.frequencyDays}
                      onChange={(e) => setForm({ ...form, frequencyDays: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Instalação
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
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhuma instalação cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                facilities.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.city || '-'}</TableCell>
                    <TableCell>{f.state || '-'}</TableCell>
                    <TableCell>{f.category || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQrFacility(f)}
                          title="QR Code"
                        >
                          <QrCode className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(f)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(f)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(f.id)}
                          title="Excluir"
                        >
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

      <Dialog open={!!qrFacility} onOpenChange={(o) => !o && setQrFacility(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>QR Code da Instalação</DialogTitle>
          </DialogHeader>
          {qrFacility && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <h3 className="text-xl font-bold text-primary">{qrFacility.name}</h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <img
                  src={getQrImageUrl(qrFacility)}
                  alt={`QR Code para ${qrFacility.name}`}
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyLink(qrFacility)}
              >
                <Copy className="w-4 h-4 mr-2" /> Copiar Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
