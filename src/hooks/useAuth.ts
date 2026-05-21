import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserType } from '@/types/database';

const PASSWORD_RECOVERY_KEY = 'password_recovery_active';

const hasPasswordRecoveryToken = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);

  return hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery';
};

const markPasswordRecovery = () => {
  sessionStorage.setItem(PASSWORD_RECOVERY_KEY, '1');
};

const clearPasswordRecoveryFlag = () => {
  sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
};

const getInitialPasswordRecoveryState = () => {
  const isRecovery = sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === '1' || hasPasswordRecoveryToken();

  if (isRecovery) {
    markPasswordRecovery();
  }

  return isRecovery;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(getInitialPasswordRecoveryState);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || hasPasswordRecoveryToken()) {
          markPasswordRecovery();
          setIsPasswordRecovery(true);
        } else if (event === 'SIGNED_OUT') {
          clearPasswordRecoveryFlag();
          setIsPasswordRecovery(false);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && (sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === '1' || hasPasswordRecoveryToken())) {
        markPasswordRecovery();
        setIsPasswordRecovery(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const requestPasswordReset = async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error };
  };

  const clearPasswordRecovery = () => {
    clearPasswordRecoveryFlag();
    setIsPasswordRecovery(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      // Force local cleanup even if server returns error
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    return { error: null };
  };

  const updateProfileName = async (nome: string) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    const { error } = await supabase
      .from('users_profile')
      .update({ nome })
      .eq('id', user.id);

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error };
  };

  const createProfile = async (nome: string, tipo: UserType) => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    
    const { error } = await supabase
      .from('users_profile')
      .insert({
        id: user.id,
        nome,
        tipo,
      });
    
    if (!error) {
      await fetchProfile(user.id);
    }
    
    return { error };
  };

  return {
    user,
    session,
    profile,
    isPasswordRecovery,
    loading,
    signUp,
    signIn,
    requestPasswordReset,
    updatePassword,
    clearPasswordRecovery,
    signOut,
    createProfile,
    updateProfileName,
    refreshProfile: () => user && fetchProfile(user.id),
  };
};
