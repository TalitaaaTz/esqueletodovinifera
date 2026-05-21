import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import logoImg from '@/assets/logo-viniferasense.png';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, isPasswordRecovery, loading, updatePassword, clearPasswordRecovery } = useAuthContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error('Erro ao atualizar senha: ' + error.message);
        return;
      }

      clearPasswordRecovery();
      toast.success('Senha atualizada com sucesso!');
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img src={logoImg} alt="ViniferaSense" className="h-20 w-auto object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <img src={logoImg} alt="ViniferaSense" className="h-20 w-auto mb-3" />
        <h1 className="text-xl font-bold text-foreground">ViniferaSense</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recuperação de senha
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(var(--vs-auth-card))] p-6 sm:p-8 rounded-2xl shadow-sm border border-border">
            {!session || !isPasswordRecovery ? (
              <div className="space-y-5 text-center">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Link inválido ou expirado</h2>
                  <p className="text-sm text-muted-foreground">
                    Solicite um novo link de recuperação para alterar sua senha.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate('/auth', { replace: true })}
                  className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
                >
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">Defina sua nova senha</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma senha segura para acessar sua conta.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="new-password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-background border-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : 'Salvar nova senha'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
