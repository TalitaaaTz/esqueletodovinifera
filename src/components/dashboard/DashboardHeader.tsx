import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, LogOut, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  variant: 'motorista' | 'gestor';
  onRefresh?: () => void;
}

export const DashboardHeader = ({ variant, onRefresh }: DashboardHeaderProps) => {
  const { profile, signOut, updateProfileName } = useAuthContext();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile?.nome ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Até logo!');
    }
  };

  const handleOpenProfileDialog = () => {
    setProfileName(profile?.nome ?? '');
    setProfileDialogOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = profileName.trim();
    if (cleanName.length < 2) {
      toast.error('Informe um nome com pelo menos 2 caracteres');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await updateProfileName(cleanName);
      if (error) {
        toast.error('Erro ao atualizar nome: ' + error.message);
        return;
      }

      toast.success('Nome atualizado!');
      setProfileDialogOpen(false);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Logo
              size="sm"
              variant={variant === 'gestor' ? 'dark' : 'light'}
            />

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleOpenProfileDialog}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span>
                  Olá, <span className="font-medium text-foreground">{profile?.nome}</span>
                </span>
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenProfileDialog}
                className="h-9 w-9 sm:hidden"
                aria-label="Editar nome"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  className="h-9 w-9"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar nome</DialogTitle>
            <DialogDescription>
              Esse nome aparece no topo da sua dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-foreground">Nome de usuário</Label>
              <Input
                id="profile-name"
                type="text"
                placeholder="Seu nome"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-12 bg-background border-input"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar nome'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
