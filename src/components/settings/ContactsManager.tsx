import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export function ContactsManager() {
  const { contacts, updateContacts } = useAppContext()

  const handleContactChange = (index: number, field: keyof (typeof contacts)[0], value: string) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    updateContacts(newContacts)
  }

  const saveContacts = () => {
    toast.success('Contatos atualizados com sucesso.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações Críticas</CardTitle>
        <CardDescription>
          Configuração de contatos para alertas de Não Conformidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {contacts.map((contact, idx) => (
          <div key={contact.id} className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-semibold text-primary">{contact.sector}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">E-mail</Label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">WhatsApp (com DDI/DDD)</Label>
                <Input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <Button onClick={saveContacts} className="w-full gap-2 mt-4">
          <Save className="h-4 w-4" /> Salvar Contatos
        </Button>
      </CardContent>
    </Card>
  )
}
