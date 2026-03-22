import { useAppContext } from '@/store/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Trash2, Save, Shield, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export default function Profile() {
  const { profile, updateProfile, syncData, isSyncing, clearLocalData, isOnline } = useAppContext()
  const [formData, setFormData] = useState(profile)

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  const handleSave = () => {
    updateProfile(formData)
    toast.success('Perfil atualizado com sucesso!')
  }

  const handleForceSync = async () => {
    if (!isOnline) {
      toast.error('Você está offline. Conecte-se para sincronizar.')
      return
    }
    await syncData()
    toast.success('Sincronização concluída.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Perfil</h1>
        <p className="text-muted-foreground">Seus dados e gestão do aplicativo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Informações Pessoais
            <Badge variant={formData.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
              {formData.role === 'admin' ? (
                <>
                  <ShieldAlert className="w-3 h-3 mr-1" /> Administrador
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" /> Avaliador
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback className="text-2xl">{formData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail Corporativo</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                      <SelectItem value="evaluator">Avaliador (Apenas Inspeções)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>Nota:</strong> Avaliadores têm acesso restrito à realização de inspeções
                    e não podem modificar configurações ou acessar painéis gerenciais.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-secondary/20">
        <CardHeader>
          <CardTitle className="text-secondary">Gestão de Dados</CardTitle>
          <CardDescription>Gerencie o armazenamento offline e sincronização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleForceSync}
              disabled={isSyncing || !isOnline}
            >
              <RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin-slow' : 'h-4 w-4'} />
              Forçar Sincronização
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={clearLocalData}>
              <Trash2 className="h-4 w-4" />
              Limpar Cache Local
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Atenção: Limpar o cache excluirá inspeções não sincronizadas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
