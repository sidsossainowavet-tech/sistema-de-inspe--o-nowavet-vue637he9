import { useState } from 'react'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save, Send, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Inspection } from '@/lib/types'
import { SystemLogger } from '@/lib/logger'

export function ContactsManager() {
  const { contacts, updateContacts, profile } = useAppContext()
  const [isTesting, setIsTesting] = useState(false)

  const handleContactChange = (index: number, field: keyof (typeof contacts)[0], value: string) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    updateContacts(newContacts)
  }

  const saveContacts = () => {
    toast.success('Contatos atualizados com sucesso.')
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    SystemLogger.logAudit(profile.email, 'Início de Teste de Conexão (Envios)')
    try {
      const dummyInspection: Inspection = {
        id: 'test-' + Date.now(),
        structure: 'Teste de Conectividade (Painel)',
        type: 'Check-in',
        date: new Date().toISOString(),
        inspector: 'Administrador do Sistema',
        isSynced: false,
        answers: [
          { itemId: 't1', status: 'C', itemName: 'Conexão de E-mail SMTP' },
          { itemId: 't2', status: 'C', itemName: 'Conexão de API WhatsApp' },
        ],
      }

      toast.info('Iniciando teste de envio. Processando conectividade externa...', {
        duration: 3000,
      })
      const result = await api.sendInspectionEmail(dummyInspection, contacts)

      if (result.emailError) {
        toast.error(`❌ Erro no E-mail: ${result.emailError}`, { duration: 10000 })
        SystemLogger.logError(profile.email, 'Teste de Conexão (E-mail)', result.emailError)
      } else {
        toast.success('✅ E-mail disparado e aceito pelo servidor com sucesso!')
        SystemLogger.logAudit(profile.email, 'Teste de Conexão E-mail bem-sucedido')
      }

      if (result.whatsappError) {
        if (
          result.whatsappError.includes('Simulação') ||
          result.whatsappError.includes('ausentes')
        ) {
          toast.warning(`⚠️ Aviso WhatsApp: ${result.whatsappError}`, { duration: 8000 })
        } else {
          toast.error(`❌ Erro no WhatsApp: ${result.whatsappError}`, { duration: 10000 })
          SystemLogger.logError(profile.email, 'Teste de Conexão (WhatsApp)', result.whatsappError)
        }
      } else {
        toast.success('✅ Mensagem de WhatsApp processada pelo provedor com sucesso!')
        SystemLogger.logAudit(profile.email, 'Teste de Conexão WhatsApp bem-sucedido')
      }
    } catch (err: any) {
      toast.error(`🚨 Falha Crítica na Comunicação: ${err.message}`, { duration: 10000 })
      SystemLogger.logError(profile.email, 'Teste de Conexão Crítico', err.message)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações Críticas</CardTitle>
        <CardDescription>
          Configuração de contatos para alertas de Não Conformidade e recebimento de relatórios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50 shadow-sm"
          >
            <h4 className="font-semibold text-primary">{contact.sector}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  E-mail de Destino
                </Label>
                <Input
                  type="email"
                  value={contact.email}
                  placeholder="exemplo@nowavet.com.br"
                  onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  WhatsApp (DDD + Número)
                </Label>
                <Input
                  type="tel"
                  value={contact.phone}
                  placeholder="(11) 99999-9999"
                  onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-6">
          <Button onClick={saveContacts} className="flex-1 gap-2 shadow-sm">
            <Save className="h-4 w-4" /> Salvar Contatos
          </Button>
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 gap-2 border border-primary/20 shadow-sm bg-primary/5 hover:bg-primary/10 text-primary"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isTesting ? 'Diagnosticando Conexões...' : 'Testar Envios (Diagnóstico)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
