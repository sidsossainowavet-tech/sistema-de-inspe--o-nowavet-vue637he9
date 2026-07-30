import { useRef, useState } from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
  itemId: string
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1024
        let width = img.width
        let height = img.height
        if (width > height && width > MAX) {
          height *= MAX / width
          width = MAX
        } else if (height > MAX) {
          width *= MAX / height
          height = MAX
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas nao disponivel'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function FileUpload({ photos, onChange, maxPhotos = 5, itemId, error }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setLocalError('')
    const remaining = maxPhotos - photos.length
    if (remaining <= 0) {
      setLocalError('Maximo de 5 fotos por pergunta')
      return
    }
    const fileArray = Array.from(files).slice(0, remaining)
    const newPhotos: string[] = []
    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError('Tipo de arquivo invalido. Use JPEG, PNG, WEBP ou GIF.')
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setLocalError('Arquivo muito grande. Maximo de 10MB por foto.')
        continue
      }
      try {
        const compressed = await compressImage(file)
        newPhotos.push(compressed)
      } catch {
        setLocalError('Erro ao processar imagem.')
      }
    }
    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos])
    }
  }

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
    setLocalError('')
  }

  const displayError = error || localError

  return (
    <div className="space-y-2" id={`upload-${itemId}`}>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden group shrink-0">
            <img src={photo} alt={`Foto ${index + 1}`} className="object-cover w-full h-full" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removePhoto(index)}
              type="button"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <div
            className={cn(
              'w-20 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors shrink-0',
              displayError && 'border-destructive',
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground mt-1">
              {photos.length}/{maxPhotos}
            </span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {displayError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}
    </div>
  )
}
