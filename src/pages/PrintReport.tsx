import { useParams, Link } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, MessageSquare, Mail } from 'lucide-react'
import { useEffect } from 'react'

export default function PrintReport() {
  const { id } = useParams()
  const { inspections, items, contacts } = useAppContext()

  const inspection = inspections.find((i) => i.id === id)

  if (!inspection) return <div className="p-8 text-center">Inspeção não encontrada.</div>

  const printDoc = () => window.print()

  const ncs = inspection.answers.filter((a) => a.status === 'NC')

  // WhatsApp Share Link
  const waMessage = encodeURIComponent(
    `*Relatório de Vistoria - Nowavet Agro*\nEstrutura: ${inspection.structure}\nTipo: ${inspection.type}\nData: ${new Date(inspection.date).toLocaleDateString('pt-BR')}\nNão Conformidades: ${ncs.length}\n*Acesse o sistema para ver o PDF completo.*`,
  )
  const waContact = contacts.find((c) => c.sector === 'Qualidade')?.phone || ''

  return (
    <div className="bg-white min-h-screen">
      {/* Controls - Hidden in print */}
      <div className="no-print sticky top-0 bg-muted/90 p-4 border-b flex justify-between items-center z-50 backdrop-blur">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href={`https://wa.me/${waContact}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Compartilhar WA
            </a>
          </Button>
          <Button onClick={printDoc}>
            <Printer className="h-4 w-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 text-slate-800">
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
              <span className="text-slate-500 block mb-1">Status de Sincronização</span>
              <strong>{inspection.isSynced ? 'Sincronizado' : 'Offline'}</strong>
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
                className={`flex flex-col md:flex-row gap-6 p-4 rounded-lg border ${isNC ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
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
                  <div className="w-full md:w-48 h-32 shrink-0 border rounded overflow-hidden bg-slate-100">
                    <img
                      src={answer.photo}
                      alt="Evidência"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 break-inside-avoid">
          <p>Documento gerado automaticamente pelo Sistema de Inspeções Nowavet Agro.</p>
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
