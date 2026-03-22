import { useState } from 'react'
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
import { Answer } from '@/lib/types'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function NewInspection() {
  const { items, facilities, evaluators, addInspection } = useAppContext()
  const navigate = useNavigate()

  const activeItems = items.filter((i) => i.active)

  const [facilityId, setFacilityId] = useState('')
  const [evaluatorId, setEvaluatorId] = useState('')
  const [type, setType] = useState<'Check-in' | 'Check-out'>('Check-in')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})

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
      const isMandatory = item.mandatory !== false // Default to true if undefined

      if (isMandatory && !ans?.status) {
        toast.error(`Item "${item.name}" é obrigatório.`)
        return false
      }

      // If a status was given, require photo and justification if needed
      if (ans?.status && !ans.photo) {
        toast.error(`Item "${item.name}" requer foto.`)
        return false
      }
      if (ans?.status === 'NC' && !ans.justification?.trim()) {
        toast.error(`Item "${item.name}" requer justificativa para Não Conformidade.`)
        return false
      }
    }
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const facility = facilities.find((f) => f.id === facilityId)
    const evaluator = evaluators.find((e) => e.id === evaluatorId)

    addInspection({
      structure: facility?.name || 'Desconhecido',
      type,
      inspector: evaluator?.name || 'Desconhecido',
      answers: Object.values(answers).filter((a) => a.status),
    })

    toast.success('Inspeção salva com sucesso!')
    navigate('/')
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-1">Nova Inspeção</h1>
        <p className="text-muted-foreground">Preencha todos os campos obrigatórios (*)</p>
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
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger id="facility">
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
            <Select value={evaluatorId} onValueChange={setEvaluatorId}>
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
            <Select value={type} onValueChange={(v: any) => setType(v)}>
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

      <div className="space-y-4">
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
        >
          <Save className="h-5 w-5" /> Salvar Inspeção
        </Button>
      </div>
    </div>
  )
}
