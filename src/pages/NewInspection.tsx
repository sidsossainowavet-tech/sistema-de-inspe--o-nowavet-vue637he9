import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChecklistItemCard } from '@/components/ChecklistItemCard'
import { QRScanner } from '@/components/QRScanner'
import { Answer } from '@/lib/types'
import { toast } from 'sonner'
import { Save, QrCode, Loader2, MailCheck } from 'lucide-react'

export default function NewInspection() {
  const { items, facilities, evaluators, addInspection } = useAppContext()
  const navigate = useNavigate()

  const activeItems = items.filter((i) => i.active)

  const [facilityId, setFacilityId] = useState('')
  const [evaluatorId, setEvaluatorId] = useState('')
  const [type, setType] = useState<'Check-in' | 'Check-out'>('Check-in')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [scannerOpen, setScannerOpen] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ duration: number; ncs: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (facilityId && !startTime) {
      setStartTime(new Date().toISOString())
    }
  }, [facilityId, startTime])

  const handleAnswerChange = (ans: Answer) => {
    setAnswers((prev) => ({ ...prev, [ans.itemId]: ans }))
  }

  const validateForm = () => {
    if (!facilityId) {
      toast.error('Selecione a instalação.')
      return false
    }
    if (!evaluatorId) {
      toast.error('Selecione o avaliador.')
      return false
    }
    for (const item of activeItems) {
      const ans = answers[item.id]
      const isMandatory = item.mandatory !== false

      if (isMandatory && !ans?.status) {
        toast.error(`Item "${item.name}" é obrigatório.`)
        return false
      }

      if (ans?.status && !ans.photo) {
        toast.error(`Item "${item.name}" requer foto para evidência em e-mail.`)
        return false
      }
      if (ans?.status === 'NC' && !ans.justification?.trim()) {
        toast.error(`Item "${item.name}" requer justificativa para Não Conformidade.`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const facility = facilities.find((f) => f.id === facilityId)
    const evaluator = evaluators.find((e) => e.id === evaluatorId)

    const endTime = new Date().toISOString()
    const durationSeconds = startTime
      ? Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
      : 0

    const finalAnswers = Object.values(answers)
      .filter((a) => a.status)
      .map((a) => {
        const itemDef = items.find((i) => i.id === a.itemId)
        return {
          ...a,
          itemName: itemDef?.name || a.itemId,
        }
      })

    const ncs = finalAnswers.filter((a) => a.status === 'NC').length

    setIsLoading(true)
    await addInspection({
      facilityId: facility?.id,
      evaluatorId: evaluator?.id,
      structure: facility?.name || 'Desconhecido',
      type,
      inspector: evaluator?.name || 'Desconhecido',
      answers: finalAnswers,
      startTime,
      endTime,
      durationSeconds,
    })
    setIsLoading(false)

    setSuccessData({ duration: durationSeconds, ncs })
  }

  const handleScan = (data: string) => {
    setScannerOpen(false)

    if (data.startsWith('nowavet-facility:')) {
      const id = data.replace('nowavet-facility:', '')
      const found = facilities.find((f) => f.id === id)
      if (found) {
        setFacilityId(found.id)
        toast.success(`Instalação identificada: ${found.name}`)

        setTimeout(() => {
          document
            .getElementById('checklist-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 400)
      } else {
        toast.error('Instalação não encontrada ou QR Code inválido.')
      }
    } else {
      toast.error('Instalação não encontrada ou QR Code inválido.')
    }
  }

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 shadow-sm">
          <MailCheck className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Relatório Processado!</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          A tentativa de envio para <strong>auditoria.interna@nowavet.com.br</strong> foi realizada.
          Caso tenha ocorrido alguma falha de conexão, ele estará pendente para sincronização no
          Início.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-6">
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1">Tempo Gasto</span>
              <span className="text-xl font-bold text-foreground">
                {Math.floor(successData.duration / 60)}m {successData.duration % 60}s
              </span>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mb-1">Não Conformidades</span>
              <span className="text-xl font-bold text-destructive">{successData.ncs}</span>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => navigate('/')}
          className="mt-8 w-full max-w-sm shadow-elevation"
          size="lg"
        >
          Voltar ao Início
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {scannerOpen && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
          facilities={facilities}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">Nova Inspeção</h1>
        <p className="text-muted-foreground">Preencha todos os campos obrigatórios (*)</p>
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-16 border-dashed border-2 border-primary/50 text-primary hover:bg-primary/5 bg-primary/5 text-lg shadow-sm"
          onClick={() => setScannerOpen(true)}
        >
          <QrCode className="w-6 h-6 mr-3" />
          Escanear QR Code da Instalação
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-xs text-muted-foreground uppercase font-semibold">
            ou selecione manualmente
          </span>
          <div className="h-px bg-border flex-1"></div>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Dados Iniciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facility">
              Instalação / Estrutura <span className="text-destructive">*</span>
            </Label>
            <Select value={facilityId} onValueChange={setFacilityId} disabled={isLoading}>
              <SelectTrigger
                id="facility"
                className={
                  facilityId ? 'bg-primary/5 border-primary/40 font-medium text-primary' : ''
                }
              >
                <SelectValue placeholder="Selecione a instalação..." />
              </SelectTrigger>
              <SelectContent>
                {facilities.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhuma cadastrada
                  </SelectItem>
                ) : (
                  facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluator">
              Avaliador Responsável <span className="text-destructive">*</span>
            </Label>
            <Select value={evaluatorId} onValueChange={setEvaluatorId} disabled={isLoading}>
              <SelectTrigger id="evaluator">
                <SelectValue placeholder="Selecione o avaliador..." />
              </SelectTrigger>
              <SelectContent>
                {evaluators.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum cadastrado
                  </SelectItem>
                ) : (
                  evaluators.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo de Inspeção <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(v: any) => setType(v)} disabled={isLoading}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check-in">Check-in (Entrada)</SelectItem>
                <SelectItem value="Check-out">Check-out (Saída)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div id="checklist-section" className="space-y-4 pt-4 scroll-mt-20">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          Checklist
          <span className="text-xs font-normal text-muted-foreground px-2 py-1 bg-muted rounded-full">
            {Object.keys(answers).filter((k) => answers[k].status).length} / {activeItems.length}{' '}
            respondidos
          </span>
        </h2>
        {activeItems.length === 0 ? (
          <p className="text-muted-foreground italic">Nenhum item ativo configurado.</p>
        ) : (
          activeItems.map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              answer={answers[item.id]}
              onChange={handleAnswerChange}
            />
          ))
        )}
      </div>

      <div className="pt-4 sticky bottom-16 md:bottom-4 z-10 print:hidden">
        <Button
          size="lg"
          className="w-full shadow-elevation text-lg py-6 gap-2"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isLoading ? 'Processando...' : 'Finalizar e Enviar para Auditoria'}
        </Button>
      </div>
    </div>
  )
}
