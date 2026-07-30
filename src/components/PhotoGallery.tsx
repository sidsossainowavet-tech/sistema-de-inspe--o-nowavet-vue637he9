import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PhotoGalleryProps {
  photos: string[]
  className?: string
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!photos || photos.length === 0) return null

  return (
    <>
      <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2', className)}>
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setSelected(photo)}
            className="relative aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
            type="button"
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 border-none bg-black/90">
          {selected && (
            <img
              src={selected}
              alt="Foto ampliada"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
