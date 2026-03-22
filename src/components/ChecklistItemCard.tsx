import React, { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Camera, AlertTriangle, X } from 'lucide-react'
import { ChecklistItem, Answer, StatusType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  item: ChecklistItem
  answer?: Answer
  onChange: (answer: Answer) => void
}

export function ChecklistItemCard({ item, answer, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentStatus = answer?.status || null
  const currentPhoto = answer?.photo || ''
  const currentJustification = answer?.justification || ''
  const isMandatory = item.mandatory !== false

  const handleStatusChange = (val: string) => {
    onChange({
      itemId: item.id,
      status: val as StatusType,
      photo: currentPhoto,
      justification: currentJustification,
    })
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      itemId: item.id,
      status: currentStatus,
      photo: currentPhoto,
      justification: e.target.value,
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange({
          itemId: item.id,
          status: currentStatus,
          photo: reader.result as string,
          justification: currentJustification,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    onChange({
      itemId: item.id,
      status: currentStatus,
      photo: undefined,
      justification: currentJustification,
    })
  }

  const isNC = currentStatus === 'NC'
  const isComplete =
    currentStatus && currentPhoto && (!isNC || (isNC && currentJustification.trim().length > 0))

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isComplete ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-border shadow-sm',
      )}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-3 flex items-center">
              {item.name}
              {isMandatory && <span className="text-destructive ml-1 text-lg leading-none">*</span>}
            </h4>
            <RadioGroup
              value={currentStatus || ''}
              onValueChange={handleStatusChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="C"
                  id={`${item.id}-c`}
                  className="text-accent border-accent"
                />
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

          <div className="shrink-0 flex flex-col items-center justify-center border rounded-md p-2 bg-muted/50 w-full md:w-32 h-32 relative overflow-hidden group">
            {currentPhoto ? (
              <>
                <img
                  src={currentPhoto}
                  alt="Evidência"
                  className="object-cover w-full h-full rounded"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={removePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div
                className="text-center space-y-2 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground block">
                  {currentStatus ? 'Foto (Obrigatória)' : 'Adicionar Foto'}
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

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
              onChange={handleTextChange}
              className={cn('resize-none', !currentJustification && 'border-destructive')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
