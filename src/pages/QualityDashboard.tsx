import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, Activity } from 'lucide-react'
import { useMemo } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Navigate } from 'react-router-dom'

export default function QualityDashboard() {
  const { profile, inspections, facilities, evaluators, items } = useAppContext()

  const missedInspections = useMemo(() => {
    return facilities
      .map((f) => {
        const facilityInspections = inspections
          .filter((i) => i.facilityId === f.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const lastInspection = facilityInspections[0]
        const frequencyDays = f.frequencyDays || 7

        let isOverdue = false
        let daysOverdue = 0

        if (!lastInspection) {
          isOverdue = true
          daysOverdue = -1
        } else {
          const daysSinceLast = Math.floor(
            (new Date().getTime() - new Date(lastInspection.date).getTime()) / (1000 * 3600 * 24),
          )
          if (daysSinceLast > frequencyDays) {
            isOverdue = true
            daysOverdue = daysSinceLast - frequencyDays
          }
        }

        return { facility: f, lastInspection, isOverdue, daysOverdue, frequencyDays }
      })
      .filter((x) => x.isOverdue)
  }, [facilities, inspections])

  const recurringNCs = useMemo(() => {
    const activeNCs: any[] = []

    facilities.forEach((f) => {
      const fInspections = inspections
        .filter((i) => i.facilityId === f.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const itemStreaks: Record<string, { streak: number; firstDate: string; lastDate: string }> =
        {}

      fInspections.forEach((insp) => {
        insp.answers.forEach((ans) => {
          if (ans.status === 'NC') {
            if (!itemStreaks[ans.itemId]) {
              itemStreaks[ans.itemId] = { streak: 1, firstDate: insp.date, lastDate: insp.date }
            } else {
              itemStreaks[ans.itemId].streak += 1
              itemStreaks[ans.itemId].lastDate = insp.date
            }
          } else if (ans.status === 'C' || ans.status === 'NA') {
            delete itemStreaks[ans.itemId]
          }
        })
      })

      Object.entries(itemStreaks).forEach(([itemId, data]) => {
        if (data.streak > 0) {
          const itemDef = items.find((i) => i.id === itemId)
          const daysAlive = Math.floor(
            (new Date().getTime() - new Date(data.firstDate).getTime()) / (1000 * 3600 * 24),
          )
          activeNCs.push({
            facilityName: f.name,
            itemName: itemDef?.name || 'Item Desconhecido',
            streak: data.streak,
            daysAlive,
            firstDate: data.firstDate,
            lastDate: data.lastDate,
          })
        }
      })
    })

    return activeNCs.sort((a, b) => b.daysAlive - a.daysAlive)
  }, [facilities, inspections, items])

  const recentNCInspections = useMemo(() => {
    return inspections
      .filter((i) => i.answers.some((a) => a.status === 'NC'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((i) => {
        const failedItems = i.answers
          .filter((a) => a.status === 'NC')
          .map((a) => items.find((it) => it.id === a.itemId)?.name || 'Desconhecido')
        return {
          id: i.id,
          date: i.date,
          structure: i.structure,
          inspector: i.inspector,
          failedItems,
        }
      })
  }, [inspections, items])

  const { facChartData, evalChartData, timeVsItems } = useMemo(() => {
    const facTimes: Record<string, { total: number; count: number }> = {}
    const evalTimes: Record<string, { total: number; count: number }> = {}
    const itemsGroups: Record<number, { total: number; count: number }> = {}

    inspections.forEach((i) => {
      if (i.durationSeconds) {
        if (i.facilityId) {
          if (!facTimes[i.facilityId]) facTimes[i.facilityId] = { total: 0, count: 0 }
          facTimes[i.facilityId].total += i.durationSeconds
          facTimes[i.facilityId].count += 1
        }
        if (i.evaluatorId) {
          if (!evalTimes[i.evaluatorId]) evalTimes[i.evaluatorId] = { total: 0, count: 0 }
          evalTimes[i.evaluatorId].total += i.durationSeconds
          evalTimes[i.evaluatorId].count += 1
        }
        const len = i.answers.length
        if (len > 0) {
          if (!itemsGroups[len]) itemsGroups[len] = { total: 0, count: 0 }
          itemsGroups[len].total += i.durationSeconds
          itemsGroups[len].count += 1
        }
      }
    })

    const facChartData = Object.entries(facTimes).map(([id, data]) => ({
      name: facilities.find((f) => f.id === id)?.name || id,
      avgMins: Math.round(data.total / data.count / 60),
    }))

    const evalChartData = Object.entries(evalTimes).map(([id, data]) => ({
      name: evaluators.find((e) => e.id === id)?.name || id,
      avgMins: Math.round(data.total / data.count / 60),
    }))

    const timeVsItems = Object.entries(itemsGroups)
      .map(([len, data]) => ({
        items: parseInt(len),
        name: `${len} itens`,
        avgMins: Math.round(data.total / data.count / 60),
      }))
      .sort((a, b) => a.items - b.items)

    return { facChartData, evalChartData, timeVsItems }
  }, [inspections, facilities, evaluators])

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Qualidade e Controle</h1>
        <p className="text-muted-foreground">Monitoramento de eficiência e conformidades</p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto">
          <TabsTrigger value="alerts">Alertas & Atrasos</TabsTrigger>
          <TabsTrigger value="ncs">Não Conformidades</TabsTrigger>
          <TabsTrigger value="time">Índice de Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card className="border-t-4 border-t-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Instalações com Vistoria Atrasada
              </CardTitle>
              <CardDescription>Baseado na frequência exigida para cada instalação.</CardDescription>
            </CardHeader>
            <CardContent>
              {missedInspections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma inspeção atrasada. Tudo em dia!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalação</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Última Inspeção</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missedInspections.map((mi) => (
                        <TableRow key={mi.facility.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {mi.facility.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {mi.frequencyDays} dias
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {mi.lastInspection
                              ? new Date(mi.lastInspection.date).toLocaleDateString('pt-BR')
                              : 'Nunca realizada'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="whitespace-nowrap">
                              {mi.daysOverdue === -1
                                ? 'Pendente'
                                : `${mi.daysOverdue} dias atrasada`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ncs" className="space-y-6">
          <Card className="border-t-4 border-t-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Activity className="w-5 h-5 text-orange-500" /> Histórico de Persistência
              </CardTitle>
              <CardDescription>
                Acompanhe há quanto tempo um problema não é resolvido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recurringNCs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma não conformidade ativa.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalação</TableHead>
                        <TableHead>Item Verificado</TableHead>
                        <TableHead>Ciclos (Streak)</TableHead>
                        <TableHead>Tempo Ativo</TableHead>
                        <TableHead>Primeiro Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringNCs.map((nc, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {nc.facilityName}
                          </TableCell>
                          <TableCell className="min-w-[200px]">{nc.itemName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={nc.streak > 1 ? 'destructive' : 'secondary'}
                              className="whitespace-nowrap"
                            >
                              {nc.streak} inspeções
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-destructive whitespace-nowrap">
                            {nc.daysAlive} dias
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(nc.firstDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Recentes com Não Conformidades</CardTitle>
              <CardDescription>
                Lista de todas as ocorrências registradas recentemente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentNCInspections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma inspeção com não conformidade.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Instalação</TableHead>
                        <TableHead>Avaliador</TableHead>
                        <TableHead>Itens Falhos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentNCInspections.map((nc) => (
                        <TableRow key={nc.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {new Date(nc.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{nc.structure}</TableCell>
                          <TableCell className="whitespace-nowrap">{nc.inspector}</TableCell>
                          <TableCell className="min-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {nc.failedItems.map((item, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-destructive border-destructive/30 bg-destructive/5 text-[10px] leading-tight px-1.5 py-0"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio por Instalação</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                {facChartData.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Sem dados</p>
                ) : (
                  <ChartContainer
                    config={{ avgMins: { label: 'Minutos', color: 'hsl(var(--primary))' } }}
                  >
                    <BarChart data={facChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgMins" fill="var(--color-avgMins)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio por Avaliador</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                {evalChartData.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Sem dados</p>
                ) : (
                  <ChartContainer
                    config={{ avgMins: { label: 'Minutos', color: 'hsl(var(--secondary))' } }}
                  >
                    <BarChart data={evalChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgMins" fill="var(--color-avgMins)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">
                  Correlação: Tempo Médio vs Tamanho do Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                {timeVsItems.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Sem dados</p>
                ) : (
                  <ChartContainer
                    config={{ avgMins: { label: 'Minutos', color: 'hsl(var(--accent))' } }}
                  >
                    <BarChart data={timeVsItems}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgMins" fill="var(--color-avgMins)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
