import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import logoImg from '@/assets/logo-viniferasense.png';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, isPasswordRecovery } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to auth when not logged in
        navigate('/auth');
      } else if (isPasswordRecovery) {
        navigate('/reset-password');
      } else if (!profile) {
        navigate('/setup');
      } else {
        const routes: Record<string, string> = { gestor: '/gestor', motorista: '/motorista', autonomo: '/autonomo' };
        navigate(routes[profile.tipo] || '/gestor');
      }
    }
  }, [user, profile, loading, isPasswordRecovery, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain" />
      </div>
    </div>
  );
};

export default Index;
