import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Truck, BarChart3, User, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const ProfileSetup = () => {
  const { user, createProfile } = useAuthContext();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<UserType | null>(null);
  const [beaconCode, setBeaconCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }
    
    if (!tipo) {
      toast.error('Por favor, selecione seu tipo de perfil');
      return;
    }

    if (tipo === 'autonomo' && !beaconCode.trim()) {
      toast.error('Por favor, informe o código do beacon');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await createProfile(nome.trim(), tipo);
      
      if (error) {
        toast.error('Erro ao criar perfil: ' + error.message);
        return;
      }

      // Auto-link beacon for autonomo users
      if (tipo === 'autonomo' && user) {
        const { error: deviceError } = await supabase
          .from('user_devices')
          .insert({
            user_id: user.id,
            device_code: beaconCode.trim(),
            device_name: `Beacon ${beaconCode.trim()}`,
          });

        if (deviceError) {
          toast.error('Perfil criado, mas erro ao vincular beacon: ' + deviceError.message);
        } else {
          toast.success('Perfil criado e beacon vinculado!');
        }
      } else {
        toast.success('Perfil criado com sucesso!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Configurar Perfil</h1>
          <p className="mt-2 text-muted-foreground">
            Complete seu cadastro para continuar
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-lg border border-border">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-foreground">Seu Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="nome"
                type="text"
                placeholder="Nome e sobrenome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 h-12 bg-background border-input"
                required
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-foreground">Tipo de Perfil</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipo('gestor')}
                className={cn(
                  'p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2.5',
                  tipo === 'gestor'
                    ? 'border-primary bg-primary/10 shadow-vs-glow'
                    : 'border-border hover:border-primary/50 bg-card'
                )}
              >
                <BarChart3 className={cn(
                  'h-8 w-8',
                  tipo === 'gestor' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'font-semibold text-sm',
                  tipo === 'gestor' ? 'text-primary' : 'text-foreground'
                )}>
                  Gestor
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('motorista')}
                className={cn(
                  'p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2.5',
                  tipo === 'motorista'
                    ? 'border-primary bg-primary/10 shadow-vs-glow-green'
                    : 'border-border hover:border-primary/50 bg-card'
                )}
              >
                <Truck className={cn(
                  'h-8 w-8',
                  tipo === 'motorista' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'font-semibold text-sm',
                  tipo === 'motorista' ? 'text-primary' : 'text-foreground'
                )}>
                  Motorista
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('autonomo')}
                className={cn(
                  'p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2.5',
                  tipo === 'autonomo'
                    ? 'border-primary bg-primary/10 shadow-vs-glow'
                    : 'border-border hover:border-primary/50 bg-card'
                )}
              >
                <User className={cn(
                  'h-8 w-8',
                  tipo === 'autonomo' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'font-semibold text-sm',
                  tipo === 'autonomo' ? 'text-primary' : 'text-foreground'
                )}>
                  Autônomo
                </span>
              </button>
            </div>
          </div>

          {/* Beacon code field for autonomo */}
          {tipo === 'autonomo' && (
            <div className="space-y-2">
              <Label htmlFor="beacon" className="text-foreground">Código do Beacon</Label>
              <div className="relative">
                <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="beacon"
                  type="text"
                  placeholder="Ex: 1009"
                  value={beaconCode}
                  onChange={(e) => setBeaconCode(e.target.value)}
                  className="pl-10 h-12 bg-background border-input"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Informe o código do sensor/beacon que será vinculado à sua conta
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
            disabled={loading || !tipo}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando perfil...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
