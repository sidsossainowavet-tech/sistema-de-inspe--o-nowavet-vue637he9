import { useParams, Link, Navigate } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Loader2, Share2, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function PrintReport() {
  const { id } = useParams()
  const { inspections, items, contacts, isAuthenticated, isCheckingSession } = useAppContext()

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const inspection = inspections.find((i) => i.id === id)

  if (!inspection)
    return <div className="p-8 text-center">Inspeção não encontrada ou expirada.</div>

  const printDoc = () => window.print()

  const ncs = inspection.answers.filter((a) => a.status === 'NC')
  const waMessage = encodeURIComponent(
    `*Relatório de Vistoria - Nowavet Agro*\nEstrutura: ${inspection.structure}\nTipo: ${inspection.type}\nData: ${new Date(inspection.date).toLocaleDateString('pt-BR')}\nNCs: ${ncs.length}\n*Baixe o arquivo para ver as fotos e detalhes.*`,
  )
  const waContact = contacts.find((c) => c.sector === 'Qualidade')?.phone || ''

  const handleShareSummary = async () => {
    const shareText = `Vistoria: ${inspection.structure}\nData: ${new Date(inspection.date).toLocaleDateString('pt-BR')}\nNCs: ${ncs.length}\nGerado pelo app Nowavet.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resumo - ${inspection.structure}`,
          text: shareText,
        })
      } catch (err: any) {
        console.warn('Compartilhamento nativo bloqueado ou cancelado', err)
        if (err.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(shareText)
            toast.success('Resumo copiado para a área de transferência! Cole onde desejar.')
          } catch (clipErr) {
            toast.warning('O compartilhamento foi bloqueado pelo navegador.')
          }
        }
      }
    } else {
      toast.warning('Compartilhamento nativo não suportado neste dispositivo.')
    }
  }

  const handleShareFile = async () => {
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Relatório</title><style>body{font-family:'Segoe UI',Arial,sans-serif;color:#333;line-height:1.5}h1{color:#1e3a8a;font-size:24px;margin-bottom:5px}h2{color:#b91c1c;font-size:18px;margin-top:20px}h3{font-size:16px;margin-bottom:10px;border-bottom:1px solid #ccc;padding-bottom:5px}.header{border-bottom:2px solid #1e3a8a;padding-bottom:10px;margin-bottom:20px}.info-table{width:100%;margin-bottom:20px;border-collapse:collapse}.info-table td{padding:8px;vertical-align:top}.item{border:1px solid #e5e7eb;padding:15px;margin-bottom:15px;background:#ffffff;border-radius:8px}.item-nc{border:1px solid #fca5a5;background:#fef2f2}.badge-c{color:#166534;background:#dcfce7;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold}.badge-nc{color:#991b1b;background:#fee2e2;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold}.badge-na{color:#374151;background:#f3f4f6;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold}.justification{margin-top:8px;font-size:14px}.photo-container{margin-top:15px;padding-top:10px;border-top:1px solid #e5e7eb}img{max-width:400px;height:auto;display:block;border:1px solid #ddd;padding:4px;background:#fff}</style></head><body><div class="header"><h1>NOWAVET AGRO</h1><p style="text-transform:uppercase;font-size:12px;font-weight:bold;color:#64748b">Relatório de Vistoria Estrutural</p></div><table class="info-table"><tr><td><span style="color:#64748b;font-size:12px">Estrutura Inspecionada</span><br/><strong>${inspection.structure}</strong></td><td><span style="color:#64748b;font-size:12px">Tipo de Vistoria</span><br/><strong>${inspection.type}</strong></td></tr><tr><td><span style="color:#64748b;font-size:12px">Inspetor Responsável</span><br/><strong>${inspection.inspector}</strong></td><td><span style="color:#64748b;font-size:12px">Data da Inspeção</span><br/><strong>${new Date(inspection.date).toLocaleString('pt-BR')}</strong></td></tr></table>${ncs.length > 0 ? `<h2>⚠️ Resumo de Não Conformidades (${ncs.length})</h2><p style="font-size:14px">As seguintes áreas requerem atenção imediata das equipes de Projetos e Qualidade.</p>` : ''}<h3>Detalhamento do Checklist</h3>${inspection.answers
      .map((answer, index) => {
        const itemDef = items.find((i) => i.id === answer.itemId)
        const itemName = itemDef ? itemDef.name : 'Item Desconhecido'
        const isNC = answer.status === 'NC'
        let badgeClass = 'badge-na'
        let statusText = 'N/A'
        if (answer.status === 'C') {
          badgeClass = 'badge-c'
          statusText = 'CONFORME'
        } else if (answer.status === 'NC') {
          badgeClass = 'badge-nc'
          statusText = 'NÃO CONFORME'
        }
        return `<div class="item ${isNC ? 'item-nc' : ''}"><table style="width:100%;border:none"><tr><td style="border:none;padding:0"><strong>${index + 1}. ${itemName}</strong></td><td style="border:none;padding:0;text-align:right"><span class="${badgeClass}">${statusText}</span></td></tr></table>${isNC && answer.justification ? `<div class="justification"><strong style="font-size:12px;color:#64748b;text-transform:uppercase">Justificativa:</strong><br/>${answer.justification}</div>` : ''}${answer.photo ? `<div class="photo-container"><strong style="font-size:12px;color:#64748b;text-transform:uppercase">Registro Fotográfico:</strong><br/><img src="${answer.photo}" alt="Evidência"/></div>` : ''}</div>`
      })
      .join(
        '',
      )}<br/><br/><br/><div style="text-align:center;color:#64748b;font-size:12px"><p>Documento gerado para exportação manual pelo Sistema de Inspeções Nowavet Agro.</p><div style="margin-top:40px;width:250px;margin-left:auto;margin-right:auto;border-top:1px solid #333;padding-top:10px"><strong style="color:#333">${inspection.inspector}</strong><br/>Assinatura do Responsável</div></div></body></html>`

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' })
    const filename = `Relatorio_${inspection.structure.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`

    const downloadFallback = () => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Arquivo baixado! Envie manualmente pelo WhatsApp ou E-mail.')
    }

    try {
      const file = new File([blob], filename, { type: 'application/msword' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Relatório - ${inspection.structure}`,
          text: `Segue o relatório de vistoria da estrutura: ${inspection.structure}`,
        })
        toast.success('Relatório compartilhado com sucesso!')
      } else {
        downloadFallback()
      }
    } catch (err: any) {
      console.warn('Compartilhamento de arquivo bloqueado ou cancelado', err)
      if (err.name !== 'AbortError') {
        downloadFallback()
      }
    }
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="no-print sticky top-0 bg-white/95 p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center z-50 backdrop-blur shadow-sm">
        <Button variant="ghost" asChild className="self-start md:self-auto">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-500 text-center md:text-right hidden md:block">
            Exporte e envie o relatório para a equipe.
          </span>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {navigator.share ? (
              <Button
                variant="secondary"
                onClick={handleShareSummary}
                className="flex-1 md:flex-none"
              >
                <Share2 className="h-4 w-4 mr-2" /> WhatsApp (Resumo)
              </Button>
            ) : (
              <Button variant="secondary" asChild className="flex-1 md:flex-none">
                <a
                  href={`https://wa.me/${waContact}?text=${waMessage}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Share2 className="h-4 w-4 mr-2" /> WhatsApp (Resumo)
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShareFile}
              className="flex-1 md:flex-none border-primary text-primary hover:bg-primary/5"
            >
              <FileText className="h-4 w-4 mr-2" /> WhatsApp (Relatório Completo)
            </Button>
            <Button
              onClick={printDoc}
              className="flex-1 md:flex-none shadow-elevation bg-primary hover:bg-primary/90 text-white"
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-0 text-slate-800" id="report-content">
        <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary uppercase">NOWAVET AGRO</h1>
            <p className="text-sm font-semibold text-secondary uppercase tracking-widest mt-1">
              Relatório de Vistoria Estrutural
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              <strong>ID:</strong> #{inspection.id.toUpperCase()}
            </p>
            <p>
              <strong>Data:</strong> {new Date(inspection.date).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block mb-1">Estrutura Inspecionada</span>
              <strong className="text-lg">{inspection.structure}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Tipo de Vistoria</span>
              <strong className="text-lg">{inspection.type}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Inspetor Responsável</span>
              <strong>{inspection.inspector}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Status</span>
              <strong>Exportação Local</strong>
            </div>
          </div>
        </div>

        {ncs.length > 0 && (
          <div className="mb-8 border-l-4 border-destructive pl-4 py-2">
            <h2 className="text-lg font-bold text-destructive flex items-center gap-2 mb-2">
              ⚠️ Resumo de Não Conformidades ({ncs.length})
            </h2>
            <p className="text-sm">
              As seguintes áreas requerem atenção imediata das equipes de Projetos e Qualidade.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b pb-2 mb-4">Detalhamento do Checklist</h3>

          {inspection.answers.map((answer, index) => {
            const itemDef = items.find((i) => i.id === answer.itemId)
            const itemName = itemDef ? itemDef.name : 'Item Desconhecido'
            const isNC = answer.status === 'NC'

            return (
              <div
                key={index}
                className={`flex flex-col gap-4 p-4 rounded-lg border ${isNC ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} break-inside-avoid`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base">
                      {index + 1}. {itemName}
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        answer.status === 'C'
                          ? 'bg-green-100 text-green-800'
                          : answer.status === 'NC'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {answer.status === 'C'
                        ? 'CONFORME'
                        : answer.status === 'NC'
                          ? 'NÃO CONFORME'
                          : 'N/A'}
                    </span>
                  </div>

                  {isNC && answer.justification && (
                    <div className="mt-2">
                      <strong className="text-xs text-slate-500 uppercase block">
                        Justificativa:
                      </strong>
                      <p className="text-sm mt-1">{answer.justification}</p>
                    </div>
                  )}
                </div>

                {answer.photo && (
                  <div className="mt-4 pt-4 border-t border-slate-200 print:border-t-0 print:pt-2 flex flex-col items-center md:items-start">
                    <strong className="text-xs text-slate-500 uppercase block mb-2">
                      Registro Fotográfico (10 x 15 cm):
                    </strong>
                    <div
                      className="border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden"
                      style={{ width: '15cm', height: '10cm' }}
                    >
                      <img
                        src={answer.photo}
                        alt="Evidência"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 break-inside-avoid">
          <p>Documento gerado para exportação manual pelo Sistema de Inspeções Nowavet Agro.</p>
          <div className="mt-8 w-64 border-t border-slate-800 mx-auto pt-2">
            <strong>{inspection.inspector}</strong>
            <br />
            Assinatura do Responsável
          </div>
        </div>
      </div>
    </div>
  )
}
