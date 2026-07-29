import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Archive, Download, ShieldAlert } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAppContext } from '@/store/AppContext'
import { ItemsManager } from '@/components/settings/ItemsManager'
import { FacilitiesManager } from '@/components/settings/FacilitiesManager'
import { NotificationConfig } from '@/components/settings/NotificationConfig'

export default function Settings() {
  const { profile } = useAppContext()
  const isAdmin = profile.role === 'admin'
  const [isArchiving, setIsArchiving] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [archives, setArchives] = useState<any[]>([])

  const fetchArchives = async () => {
    if (!isAdmin) return
    setIsLoadingFiles(true)
    try {
      const files = await api.getArchivedFiles()
      const jsonFiles = files.filter((f) => f.name.endsWith('.json'))
      jsonFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setArchives(jsonFiles)
    } catch (e: any) {
      console.error('Failed to fetch archives', e)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  useEffect(() => {
    fetchArchives()
  }, [isAdmin])

  const handleArchive = async (all: boolean = false) => {
    if (
      !confirm(
        all
          ? 'Atenção: Isso irá exportar e deletar TODAS as inspeções atuais. Confirmar?'
          : 'Isso arquivará e deletará inspeções com mais de 15 dias. Confirmar?',
      )
    ) {
      return
    }

    setIsArchiving(true)
    try {
      const res = await api.archiveInspections(all)
      if (res.success) {
        toast.success(res.message)
        fetchArchives()
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleDownload = async (fileName: string) => {
    try {
      const blob = await api.downloadArchive(fileName)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      toast.error('Erro ao baixar arquivo: ' + e.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">Configurações do Sistema</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferências Locais</CardTitle>
          <CardDescription>
            Gerencie o comportamento do aplicativo no seu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-0.5">
              <Label className="text-base">Modo Offline Estrito</Label>
              <p className="text-sm text-muted-foreground">
                Força o aplicativo a trabalhar offline, salvando apenas localmente.
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between pb-4">
            <div className="space-y-0.5">
              <Label className="text-base">Notificações Sonoras</Label>
              <p className="text-sm text-muted-foreground">
                Toca um alerta ao finalizar inspeções e sincronizações.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {isAdmin && <NotificationConfig />}

      {isAdmin && <ItemsManager />}

      {isAdmin && <FacilitiesManager />}

      {isAdmin && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              Retenção e Backup de Dados
            </CardTitle>
            <CardDescription>
              O sistema é configurado para limpar automaticamente inspeções com mais de 15 dias.
              Você também pode forçar o backup e exportação manualmente através desta interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => handleArchive(false)}
                disabled={isArchiving}
                className="flex-1"
              >
                {isArchiving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4 mr-2" />
                )}
                Arquivar Antigos (+15 dias)
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleArchive(true)}
                disabled={isArchiving}
                className="flex-1"
              >
                {isArchiving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4 mr-2" />
                )}
                Exportar e Limpar Tudo Agora
              </Button>
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground tracking-wider">
                Histórico de Backups Exportados
              </h3>

              {isLoadingFiles ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : archives.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-lg text-sm text-slate-500">
                  Nenhum arquivo de backup gerado ainda.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {archives.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleString('pt-BR')} •{' '}
                          {(file.metadata?.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file.name)}
                        title="Baixar Backup"
                      >
                        <Download className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
