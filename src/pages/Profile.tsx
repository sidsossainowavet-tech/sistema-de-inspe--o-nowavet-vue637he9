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
import {
  RefreshCw,
  Trash2,
  Save,
  Shield,
  ShieldAlert,
  Users,
  Camera,
  LogOut,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { profile, updateProfile, syncData, isSyncing, clearLocalData, isOnline, logout } =
    useAppContext()
  const [formData, setFormData] = useState(profile)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      toast.success('Perfil atualizado com sucesso!')
    } catch (e) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleForceSync = async () => {
    if (!isOnline) {
      toast.error('Você está offline. Conecte-se para sincronizar.')
      return
    }
    await syncData()
    toast.success('Sincronização concluída.')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return toast.error('Selecione um arquivo de imagem válido.')
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('A imagem deve ter no máximo 2MB.')
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      const updatedProfile = { ...formData, avatar: base64 }
      setFormData(updatedProfile)
      try {
        await updateProfile(updatedProfile)
        toast.success('Foto de perfil atualizada!')
      } catch {
        toast.error('Erro ao salvar foto.')
      }
    }
    reader.onerror = () => toast.error('Erro ao processar a imagem.')
    reader.readAsDataURL(file)
  }

  const handleLogout = () => {
    logout()
    toast.success('Sessão encerrada.')
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
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer rounded-full"
                onClick={() => fileInputRef.current?.click()}
                title="Alterar foto de perfil"
              >
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-md group-hover:ring-primary/50 transition-all duration-300">
                  <AvatarImage src={formData.avatar} className="object-cover" />
                  <AvatarFallback className="text-3xl font-medium">
                    {formData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-3 h-3 mr-2" /> Editar Foto
              </Button>
            </div>

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
                    disabled={formData.role === 'evaluator'}
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
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
            {formData.role === 'admin' && (
              <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
                <Link to="/usuarios">
                  <Users className="h-4 w-4" /> Gerenciar Usuários
                </Link>
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-full sm:w-auto">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary text-lg">Gestão de Dados</CardTitle>
            <CardDescription>Gerencie o armazenamento offline e sincronização.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleForceSync}
                disabled={isSyncing || !isOnline}
              >
                <RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin-slow' : 'h-4 w-4'} /> Forçar
                Sincronização
              </Button>
              <Button variant="secondary" className="w-full gap-2" onClick={clearLocalData}>
                <Trash2 className="h-4 w-4" /> Limpar Cache Local
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center leading-tight">
              Atenção: Limpar o cache excluirá todas as inspeções pendentes de sincronização neste
              dispositivo.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-lg flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Sessão Ativa
            </CardTitle>
            <CardDescription>Encerre o acesso neste dispositivo com segurança.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-end h-[calc(100%-5rem)]">
            <Button
              variant="destructive"
              className="w-full gap-2 py-6 text-base shadow-sm hover:shadow-md transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" /> Sair do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
