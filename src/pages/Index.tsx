import { Link } from 'react-router-dom'
import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ClipboardList, AlertTriangle, CloudOff, CheckCircle2, Plus } from 'lucide-react'

export default function Index() {
  const { inspections, isOnline } = useAppContext()

  const today = new Date().toISOString().split('T')[0]
  const todayInspections = inspections.filter((i) => i.date.startsWith(today))
  const pendingSync = inspections.filter((i) => !i.isSynced)

  // Count total non-conformities across all inspections today
  const totalNCs = todayInspections.reduce(
    (acc, curr) => acc + curr.answers.filter((a) => a.status === 'NC').length,
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumo das atividades estruturais</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Realizadas Hoje</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayInspections.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNCs}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-l-4 shadow-sm hover:shadow-md transition-all',
            pendingSync.length > 0 ? 'border-l-secondary' : 'border-l-accent',
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sincronização</CardTitle>
            {pendingSync.length > 0 ? (
              <CloudOff className="h-4 w-4 text-secondary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingSync.length}{' '}
              <span className="text-sm font-normal text-muted-foreground">pendentes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-primary">Pronto para o campo?</h3>
            <p className="text-sm text-muted-foreground">
              Inicie uma nova inspeção de check-in ou check-out.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto gap-2 shadow-elevation active:scale-[0.98] transition-transform"
          >
            <Link to="/inspecao/nova">
              <Plus className="h-5 w-5" /> Iniciar Nova Inspeção
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        {inspections.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-lg border border-dashed">
            <p className="text-muted-foreground">Nenhuma inspeção realizada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.slice(0, 5).map((insp) => (
              <Card key={insp.id} className="overflow-hidden">
                <div className="flex items-center p-4 gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{insp.structure}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {insp.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(insp.date).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span
                        className={
                          insp.isSynced
                            ? 'text-accent font-medium flex items-center gap-1'
                            : 'text-secondary font-medium flex items-center gap-1'
                        }
                      >
                        {insp.isSynced ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Sincronizado
                          </>
                        ) : (
                          <>
                            <CloudOff className="h-3 w-3" /> Pendente
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/inspecao/${insp.id}/relatorio`} title="Ver PDF">
                      <FileText className="h-5 w-5 text-primary" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
