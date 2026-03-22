import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Download, AlertCircle, CheckCircle2, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '@/store/AppContext'

export function FacilityBulkImport() {
  const { facilities, setFacilities, items } = useAppContext()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [applyToExisting, setApplyToExisting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Name,Location,Category,AssignedTopic\nGalpão C,Área Leste,Armazenagem,Portões e Fechaduras\nLaboratório 3,Prédio Principal,Pesquisa,'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'template_instalacoes.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      toast.error('O arquivo parece estar vazio ou sem dados.')
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('name')
    const locIdx = headers.indexOf('location')
    const catIdx = headers.indexOf('category')
    const topicIdx = headers.indexOf('assignedtopic')

    if (nameIdx === -1 || locIdx === -1) {
      toast.error('O cabeçalho deve conter "Name" e "Location".')
      return
    }

    const newParsed = []
    const newErrors = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const name = cols[nameIdx]
      const location = cols[locIdx]
      const category = catIdx !== -1 ? cols[catIdx] : ''
      const assignedTopic = topicIdx !== -1 ? cols[topicIdx] : ''

      if (!name || !location) {
        newErrors.push(`Linha ${i + 1}: Nome e Localização são obrigatórios.`)
        continue
      }

      if (facilities.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        newErrors.push(`Linha ${i + 1}: Instalação "${name}" já existe (Duplicada).`)
        continue
      }

      const topics: string[] = []
      if (assignedTopic) {
        const matchedItem = items.find(
          (item) => item.name.toLowerCase() === assignedTopic.toLowerCase(),
        )
        if (matchedItem) {
          topics.push(matchedItem.id)
        }
      }

      newParsed.push({ name, description: location, category, managementTopics: topics })
    }

    setParsedData(newParsed)
    setErrors(newErrors)

    if (newParsed.length > 0) {
      toast.success(`${newParsed.length} instalações validadas.`)
      setStep(2)
    } else {
      toast.error('Nenhuma instalação válida encontrada para importação.')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const handleImport = () => {
    const newFacilities = parsedData.map((d) => ({
      id: Math.random().toString(36).substring(2),
      name: d.name,
      description: d.description,
      category: d.category,
      managementTopics: Array.from(new Set([...d.managementTopics, ...selectedTopics])),
    }))

    let updatedExisting = facilities
    if (applyToExisting && selectedTopics.length > 0) {
      updatedExisting = facilities.map((f) => ({
        ...f,
        managementTopics: Array.from(new Set([...(f.managementTopics || []), ...selectedTopics])),
      }))
    }

    setFacilities([...updatedExisting, ...newFacilities])
    toast.success(
      `Importação concluída: ${newFacilities.length} criadas. Tópicos sincronizados: ${selectedTopics.length}.`,
    )
    setOpen(false)
    reset()
  }

  const reset = () => {
    setStep(1)
    setParsedData([])
    setErrors([])
    setSelectedTopics([])
    setApplyToExisting(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary/5 border-primary/20 hover:bg-primary/10"
        >
          <FileUp className="h-4 w-4 mr-2" /> Importar Instalações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importação em Massa</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">1. Baixe o modelo</h4>
                <p className="text-xs text-muted-foreground">
                  Utilize nossa planilha padrão para preencher os dados.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" /> Modelo CSV
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">2. Envie o arquivo</h4>
                <p className="text-xs text-muted-foreground">
                  Faça o upload do CSV preenchido. (Evite usar vírgulas nos nomes)
                </p>
              </div>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Selecionar CSV
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>

            {errors.length > 0 && (
              <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" /> Foram encontrados erros:
                </h4>
                <ScrollArea className="h-32">
                  <ul className="text-xs text-destructive space-y-1 list-disc pl-4">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="bg-primary/10 text-primary p-3 rounded-md flex items-center text-sm border border-primary/20">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span>
                <strong>{parsedData.length}</strong> instalações validadas e prontas.
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">Sincronizar Tópicos de Gestão</h4>
                <p className="text-xs text-muted-foreground">
                  Selecione os itens de checklist que devem ser vinculados a estas instalações.
                </p>
              </div>

              <ScrollArea className="h-40 border rounded-md p-3 bg-muted/20">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`topic-${item.id}`}
                        checked={selectedTopics.includes(item.id)}
                        onCheckedChange={() => toggleTopic(item.id)}
                      />
                      <Label
                        htmlFor={`topic-${item.id}`}
                        className="font-normal cursor-pointer text-sm leading-tight"
                      >
                        {item.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-start space-x-3 bg-muted/40 p-3 rounded-md border">
              <Checkbox
                id="apply-existing"
                checked={applyToExisting}
                onCheckedChange={(c) => setApplyToExisting(!!c)}
                className="mt-0.5"
              />
              <Label
                htmlFor="apply-existing"
                className="font-normal cursor-pointer text-sm leading-tight"
              >
                Aplicar estes tópicos também às instalações já existentes no sistema
              </Label>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleImport}>Confirmar e Importar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
