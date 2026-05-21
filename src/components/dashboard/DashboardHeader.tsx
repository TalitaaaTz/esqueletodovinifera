import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  variant: 'motorista' | 'gestor';
  onRefresh?: () => void;
}

export const DashboardHeader = ({ variant, onRefresh }: DashboardHeaderProps) => {
  const { profile, signOut } = useAuthContext();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Até logo!');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Logo 
            size="sm" 
            variant={variant === 'gestor' ? 'dark' : 'light'} 
          />
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Olá, <span className="font-medium text-foreground">{profile?.nome}</span>
            </span>
            
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
  );
};
