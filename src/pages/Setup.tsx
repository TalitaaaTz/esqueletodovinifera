import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProfileSetup } from '@/components/profile/ProfileSetup';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo-viniferasense.png';
import { toast } from 'sonner';
import { UserType } from '@/types/database';

const Setup = () => {
  const navigate = useNavigate();
  const { user, profile, loading, createProfile, refreshProfile } = useAuthContext();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile) {
        const routes: Record<string, string> = { gestor: '/gestor', motorista: '/motorista', autonomo: '/autonomo' };
        navigate(routes[profile.tipo] || '/gestor');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const autoConfigure = async () => {
      if (!user || profile || processing) return;

      const pendingRaw = localStorage.getItem('pending_profile');
      if (!pendingRaw) return;

      setProcessing(true);
      try {
        const pending = JSON.parse(pendingRaw) as { nome: string; tipo: UserType; beaconCode: string | null };
        
        const { error } = await createProfile(pending.nome, pending.tipo);
        if (error) {
          toast.error('Erro ao criar perfil: ' + error.message);
          return;
        }

        if (pending.tipo === 'autonomo' && pending.beaconCode) {
          await supabase.from('user_devices').insert({
            user_id: user.id,
            device_code: pending.beaconCode,
            device_name: `Beacon ${pending.beaconCode}`,
          });
        }

        localStorage.removeItem('pending_profile');
        toast.success('Perfil configurado!');
        refreshProfile();
      } catch {
        toast.error('Erro ao configurar perfil');
      } finally {
        setProcessing(false);
      }
    };

    autoConfigure();
  }, [user, profile, processing, createProfile, refreshProfile]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain" />
      </div>
      </div>
    );
  }

  if (!localStorage.getItem('pending_profile') && !profile && !processing) {
    return <ProfileSetup />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-center space-y-4">
        <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain mx-auto" />
        <p className="text-muted-foreground text-sm">Configurando seu perfil...</p>
      </div>
    </div>
  );
};

export default Setup;
