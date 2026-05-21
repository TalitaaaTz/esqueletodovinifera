import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthContext } from '@/contexts/AuthContext';
import logoImg from '@/assets/logo-viniferasense.png';

const Auth = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        const routes: Record<string, string> = { gestor: '/gestor', motorista: '/motorista', autonomo: '/autonomo' };
        navigate(routes[profile.tipo] || '/gestor');
      } else {
        navigate('/setup');
      }
    }
  }, [user, profile, loading, navigate]);

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
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <img src={logoImg} alt="ViniferaSense" className="h-20 w-auto mb-3" />
        <h1 className="text-xl font-bold text-foreground">ViniferaSense</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoramento Inteligente de Cargas
        </p>
      </div>
      
      {/* Form card */}
      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(var(--vs-auth-card))] p-6 sm:p-8 rounded-2xl shadow-sm border border-border">
            <AuthForm />
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            Cada carga carrega uma história.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
