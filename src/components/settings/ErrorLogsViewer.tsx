import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { ErrorLog } from '@/lib/types'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [])

  return (
    <Card className="border-destructive/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Logs de Erro
          </CardTitle>
          <CardDescription>Registro detalhado de falhas operacionais e envios.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário / Contexto</TableHead>
              <TableHead>Mensagem de Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Nenhum erro registrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-sm min-w-[200px]">
                    <div className="font-semibold">{log.context}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.user_email || 'Sistema'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-destructive font-mono text-xs whitespace-pre-wrap">
                    {log.error_message}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-1 text-muted-foreground text-[10px]">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
