import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function Settings() {
  const { items, toggleItemStatus, contacts, updateContacts } = useAppContext()

  const handleContactChange = (index: number, field: keyof (typeof contacts)[0], value: string) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    updateContacts(newContacts)
  }

  const saveContacts = () => {
    toast.success('Contatos atualizados com sucesso.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
        <p className="text-muted-foreground">Gerencie parâmetros do sistema</p>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Itens do Checklist</TabsTrigger>
          <TabsTrigger value="contacts">Contatos Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Itens</CardTitle>
              <CardDescription>
                Ative ou desative itens que aparecerão nas novas inspeções.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between space-x-2 py-3 border-b last:border-0"
                >
                  <Label
                    htmlFor={`item-${item.id}`}
                    className="flex flex-col space-y-1 cursor-pointer"
                  >
                    <span className="font-medium text-base">{item.name}</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      {item.active ? 'Ativo no checklist' : 'Oculto do checklist'}
                    </span>
                  </Label>
                  <Switch
                    id={`item-${item.id}`}
                    checked={item.active}
                    onCheckedChange={() => toggleItemStatus(item.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
