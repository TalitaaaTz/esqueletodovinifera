import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, Truck, BarChart3, User, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const { signIn, signUp, createProfile } = useAuthContext();
  const [step, setStep] = useState<'role' | 'credentials' | 'quickAccess'>('role');
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [beaconCode, setBeaconCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autonomoMode, setAutonomoMode] = useState<'quick' | 'email' | null>(null);

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    if (role === 'autonomo') {
      setStep('quickAccess');
    } else {
      setStep('credentials');
    }
  };

  const handleQuickAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }
    if (!beaconCode.trim()) {
      toast.error('Por favor, informe o código do beacon');
      return;
    }

    setLoading(true);
    try {
      // Generate a deterministic email from beacon code for quick access
      const quickEmail = `autonomo_${beaconCode.trim().toLowerCase()}@viniferasense.local`;
      const quickPassword = `beacon_${beaconCode.trim()}_access`;

      // Try to sign in first (returning user)
      const { error: signInError } = await signIn(quickEmail, quickPassword);

      if (signInError) {
        // If login fails, create account
        const { error: signUpError } = await signUp(quickEmail, quickPassword);
        if (signUpError) {
          toast.error('Erro ao criar acesso: ' + signUpError.message);
          return;
        }

        // Store pending profile for setup
        localStorage.setItem('pending_profile', JSON.stringify({
          nome: nome.trim(),
          tipo: 'autonomo',
          beaconCode: beaconCode.trim(),
        }));

        toast.success('Acesso criado com sucesso!');
      } else {
        toast.success('Bem-vindo de volta!');
      }

      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!isLogin && !nome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    if (!isLogin && selectedRole === 'autonomo' && !beaconCode.trim()) {
      toast.error('Por favor, informe o código do beacon');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes('Invalid login credentials') ? 'Email ou senha incorretos' : error.message);
        } else {
          toast.success('Login realizado com sucesso!');
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message.includes('already registered') ? 'Este email já está cadastrado' : error.message);
          return;
        }

        localStorage.setItem('pending_profile', JSON.stringify({
          nome: nome.trim(),
          tipo: selectedRole,
          beaconCode: selectedRole === 'autonomo' ? beaconCode.trim() : null,
        }));

        toast.success('Conta criada! Verifique seu email para confirmar.');
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role Selection
  if (step === 'role') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-1">Selecione seu perfil para continuar</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { type: 'gestor' as UserType, icon: BarChart3, label: 'Gestor', desc: 'Gerencie frotas e monitore cargas' },
            { type: 'motorista' as UserType, icon: Truck, label: 'Motorista', desc: 'Acompanhe viagens e sensores' },
            { type: 'autonomo' as UserType, icon: User, label: 'Autônomo', desc: 'Monitore sua própria carga' },
          ].map(({ type, icon: Icon, label, desc }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleRoleSelect(type)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left',
                'border-border hover:border-primary/50 hover:bg-primary/5 bg-background',
                'active:scale-[0.98]'
              )}
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground block">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Autonomo: Quick Access choice
  if (step === 'quickAccess' && !autonomoMode) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => { setStep('role'); setAutonomoMode(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Como deseja entrar?</h2>
          <p className="text-sm text-muted-foreground">Escolha a forma de acesso</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setAutonomoMode('quick')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left',
              'border-border hover:border-primary/50 hover:bg-primary/5 bg-background',
              'active:scale-[0.98]'
            )}
          >
            <div className="p-3 rounded-lg bg-[hsl(var(--vs-healthy))]/15">
              <Radio className="h-6 w-6 text-[hsl(var(--vs-healthy))]" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">Acesso Rápido</span>
              <span className="text-xs text-muted-foreground">Entre com nome + código do beacon</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setAutonomoMode('email'); setStep('credentials'); }}
            className={cn(
              'p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left',
              'border-border hover:border-primary/50 hover:bg-primary/5 bg-background',
              'active:scale-[0.98]'
            )}
          >
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">Email e Senha</span>
              <span className="text-xs text-muted-foreground">Acesso tradicional com conta</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Autonomo: Quick Access form
  if (step === 'quickAccess' && autonomoMode === 'quick') {
    return (
      <form onSubmit={handleQuickAccess} className="space-y-5">
        <button
          type="button"
          onClick={() => setAutonomoMode(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--vs-healthy))]/10 border border-[hsl(var(--vs-healthy))]/20">
          <Radio className="h-4 w-4 text-[hsl(var(--vs-healthy))]" />
          <span className="text-xs font-medium text-[hsl(var(--vs-healthy))]">Acesso Rápido — Autônomo</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome" className="text-foreground">Nome completo</Label>
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
          <p className="text-xs text-muted-foreground">Código do sensor vinculado à sua carga</p>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : 'Entrar'}
        </Button>
      </form>
    );
  }

  // Step 2: Email/Password Credentials
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <button
        type="button"
        onClick={() => {
          if (selectedRole === 'autonomo') {
            setAutonomoMode(null);
            setStep('quickAccess');
          } else {
            setStep('role');
          }
        }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <span className="text-xs font-medium text-primary">
          {selectedRole === 'gestor' ? '📊 Gestor' : selectedRole === 'motorista' ? '🚛 Motorista' : '👤 Autônomo'}
        </span>
      </div>

      {/* Name field (signup only) */}
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-foreground">Nome completo</Label>
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
      )}

      {/* Beacon code (signup + autonomo only) */}
      {!isLogin && selectedRole === 'autonomo' && (
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
          <p className="text-xs text-muted-foreground">Código do sensor vinculado à sua carga</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-background border-input"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-background border-input"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processando...
          </>
        ) : isLogin ? 'Entrar' : 'Criar Conta'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {isLogin ? (
            <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
          ) : (
            <>Já tem conta? <span className="text-primary font-medium">Faça login</span></>
          )}
        </button>
      </div>
    </form>
  );
};
