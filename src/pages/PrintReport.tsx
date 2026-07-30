import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInspection } from '@/services/inspections'
import { getItemsByInspection, ItemRecord } from '@/services/items'
import { PhotoGallery } from '@/components/PhotoGallery'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Printer, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Inspection } from '@/lib/types'

const STATUS_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  approved: { label: 'Conforme', icon: CheckCircle, color: 'text-green-600' },
  disapproved: { label: 'Não Conforme', icon: XCircle, color: 'text-red-600' },
  needs_review: { label: 'N/A', icon: AlertCircle, color: 'text-yellow-600' },
}

export default function PrintReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const insp = await getInspection(id)
        const itemRecords = await getItemsByInspection(id)
        setInspection(insp)
        setItems(itemRecords)
      } catch {
        /* intentionally ignored */
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!inspection) {
    return <div className="p-8 text-center text-muted-foreground">Inspeção não encontrada.</div>
  }

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '-')
  const fmtDur = (s?: number) => (s ? `${Math.floor(s / 60)}m ${s % 60}s` : '-')

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / PDF
        </Button>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">Relatório de Inspeção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Estrutura:</span>{' '}
              <strong>{inspection.structure}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>{' '}
              <strong>{inspection.type}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Inspetor:</span>{' '}
              <strong>{inspection.inspector}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Data:</span>{' '}
              <strong>{fmt(inspection.date)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Início:</span>{' '}
              <strong>{fmt(inspection.startTime)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Fim:</span>{' '}
              <strong>{fmt(inspection.endTime)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Duração:</span>{' '}
              <strong>{fmtDur(inspection.durationSeconds)}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle>Itens Verificados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground italic">Nenhum item registrado.</p>
          ) : (
            items.map((item, idx) => {
              const info = STATUS_INFO[item.status] || STATUS_INFO.needs_review
              const Icon = info.icon
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-muted-foreground text-xs">Item {idx + 1}</span>
                      <h4 className="font-semibold">{item.name}</h4>
                    </div>
                    <div className={`flex items-center gap-1.5 font-medium ${info.color}`}>
                      <Icon className="w-4 h-4" />
                      {info.label}
                    </div>
                  </div>
                  {item.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Justificativa: </span>
                      {item.notes}
                    </div>
                  )}
                  {item.observations && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Observações: </span>
                      {item.observations}
                    </div>
                  )}
                  {item.photos.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">
                        Evidências Fotográficas ({item.photos.length})
                      </span>
                      <PhotoGallery photos={item.photos} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
