import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ItemsManager } from '@/components/settings/ItemsManager'
import { FacilitiesManager } from '@/components/settings/FacilitiesManager'
import { EvaluatorsManager } from '@/components/settings/EvaluatorsManager'
import { ContactsManager } from '@/components/settings/ContactsManager'
import { AuditLogsViewer } from '@/components/settings/AuditLogsViewer'
import { ErrorLogsViewer } from '@/components/settings/ErrorLogsViewer'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'

export default function Settings() {
  const { profile } = useAppContext()

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
        <p className="text-muted-foreground">Gerencie parâmetros principais do sistema</p>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="items" className="flex-1 min-w-[100px]">
            Itens
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex-1 min-w-[100px]">
            Instalações
          </TabsTrigger>
          <TabsTrigger value="evaluators" className="flex-1 min-w-[100px]">
            Avaliadores
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex-1 min-w-[100px]">
            Notificações
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 min-w-[100px]">
            Auditoria
          </TabsTrigger>
          <TabsTrigger
            value="errors"
            className="flex-1 min-w-[100px] text-destructive data-[state=active]:text-destructive"
          >
            Erros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <ItemsManager />
        </TabsContent>
        <TabsContent value="facilities" className="mt-4">
          <FacilitiesManager />
        </TabsContent>
        <TabsContent value="evaluators" className="mt-4">
          <EvaluatorsManager />
        </TabsContent>
        <TabsContent value="contacts" className="mt-4">
          <ContactsManager />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditLogsViewer />
        </TabsContent>
        <TabsContent value="errors" className="mt-4">
          <ErrorLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
