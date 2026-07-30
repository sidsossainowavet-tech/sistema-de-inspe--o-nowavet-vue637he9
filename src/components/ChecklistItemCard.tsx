import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'
import { ChecklistItem, Answer, StatusType } from '@/lib/types'
import { FileUpload } from '@/components/FileUpload'
import { cn } from '@/lib/utils'

interface Props {
  item: ChecklistItem
  answer?: Answer
  onChange: (answer: Answer) => void
}

export function ChecklistItemCard({ item, answer, onChange }: Props) {
  const currentStatus = answer?.status || null
  const currentPhotos = answer?.photos || []
  const currentJustification = answer?.justification || ''
  const isMandatory = item.mandatory !== false

  const update = (partial: Partial<Answer>) => {
    onChange({
      itemId: item.id,
      status: currentStatus,
      photos: currentPhotos,
      justification: currentJustification,
      ...partial,
    })
  }

  const isNC = currentStatus === 'NC'
  const isComplete =
    currentStatus && currentPhotos.length > 0 && (!isNC || currentJustification.trim().length > 0)

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isComplete ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-border shadow-sm',
      )}
    >
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-base mb-3 flex items-center">
            {item.name}
            {isMandatory && <span className="text-destructive ml-1 text-lg leading-none">*</span>}
          </h4>
          <RadioGroup
            value={currentStatus || ''}
            onValueChange={(v) => update({ status: v as StatusType })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="C" id={`${item.id}-c`} className="text-accent border-accent" />
              <Label htmlFor={`${item.id}-c`} className="cursor-pointer">
                Conforme
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="NC"
                id={`${item.id}-nc`}
                className="text-destructive border-destructive"
              />
              <Label htmlFor={`${item.id}-nc`} className="cursor-pointer">
                Não Conforme
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NA" id={`${item.id}-na`} />
              <Label htmlFor={`${item.id}-na`} className="cursor-pointer">
                N/A
              </Label>
            </div>
          </RadioGroup>
        </div>

        {currentStatus && (
          <div className="animate-fade-in-up">
            <FileUpload
              photos={currentPhotos}
              onChange={(photos) => update({ photos })}
              itemId={item.id}
              maxPhotos={5}
            />
          </div>
        )}

        {isNC && (
          <div className="space-y-2 animate-fade-in-up">
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md font-medium">
              <AlertTriangle className="h-4 w-4" />
              Notificará Qualidade, Projetos e Pesquisa Clínica
            </div>
            <Label htmlFor={`just-${item.id}`}>
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={`just-${item.id}`}
              placeholder="Descreva o problema encontrado detalhadamente..."
              value={currentJustification}
              onChange={(e) => update({ justification: e.target.value })}
              className={cn('resize-none', !currentJustification && 'border-destructive')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
