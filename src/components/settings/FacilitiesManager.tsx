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
import { Edit, Trash2, Plus, QrCode, Download, Printer } from 'lucide-react'
import { Facility } from '@/lib/types'
import { toast } from 'sonner'
import { FacilityBulkImport } from './FacilityBulkImport'

export function FacilitiesManager() {
  const { facilities, setFacilities } = useAppContext()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  const [qrFacility, setQrFacility] = useState<Facility | null>(null)

  const openDialog = (f?: Facility) => {
    if (f) {
      setEditing(f)
      setName(f.name)
      setDescription(f.description)
      setCategory(f.category || '')
    } else {
      setEditing(null)
      setName('')
      setDescription('')
      setCategory('')
    }
    setOpen(true)
  }

  const handleSave = () => {
    if (!name.trim()) return toast.error('Nome é obrigatório')

    if (editing) {
      setFacilities(
        facilities.map((f) => (f.id === editing.id ? { ...f, name, description, category } : f)),
      )
      toast.success('Instalação atualizada')
    } else {
      setFacilities([
        ...facilities,
        { id: Math.random().toString(36).substring(2), name, description, category },
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

  const handleDownloadQr = async () => {
    if (!qrFacility) return
    try {
      const response = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=nowavet-facility:${qrFacility.id}`,
      )
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${qrFacility.name.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Download iniciado')
    } catch (e) {
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=nowavet-facility:${qrFacility.id}`,
        '_blank',
      )
    }
  }

  const handlePrintQr = () => {
    if (!qrFacility) return
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${qrFacility.name}</title>
            <style>
              @page { margin: 0; }
              body { 
                display: flex; flex-direction: column; align-items: center; 
                justify-content: center; height: 100vh; margin: 0; 
                font-family: system-ui, sans-serif; text-align: center;
              }
              h1 { margin-bottom: 2rem; font-size: 3rem; color: #1e293b; }
              img { width: 500px; height: 500px; max-width: 90vw; }
              p { margin-top: 2rem; color: #64748b; font-size: 1.5rem; }
            </style>
          </head>
          <body>
            <h1>${qrFacility.name}</h1>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=nowavet-facility:${qrFacility.id}" />
            <p>Escaneie este código para iniciar a inspeção</p>
            <script>setTimeout(() => { window.print(); window.close(); }, 800);</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
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
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Armazenagem"
                  />
                </div>
                <Button className="w-full" onClick={handleSave}>
                  Salvar Instalação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhuma instalação cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell>
                    {f.category ? (
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary-foreground/10">
                        {f.category}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQrFacility(f)}
                        title="Gerar QR Code"
                      >
                        <QrCode className="h-4 w-4 text-primary" />
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

        <Dialog open={!!qrFacility} onOpenChange={(open) => !open && setQrFacility(null)}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle>QR Code da Instalação</DialogTitle>
            </DialogHeader>
            {qrFacility && (
              <div className="flex flex-col items-center space-y-6 py-4">
                <h3 className="text-xl font-bold text-primary">{qrFacility.name}</h3>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=nowavet-facility:${qrFacility.id}`}
                    alt={`QR Code para ${qrFacility.name}`}
                    className="w-48 h-48 mx-auto"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" className="flex-1" onClick={handleDownloadQr}>
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </Button>
                  <Button className="flex-1" onClick={handlePrintQr}>
                    <Printer className="w-4 h-4 mr-2" /> Imprimir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
