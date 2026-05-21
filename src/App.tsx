import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import IntroSplash from "@/components/IntroSplash";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Setup from "./pages/Setup";
import GestorDashboard from "./pages/GestorDashboard";
import GestorCarbonPage from "./pages/GestorCarbonPage";
import MotoristaDashboard from "./pages/MotoristaDashboard";
import AutonomoDashboard from "./pages/AutonomoDashboard";
import PublicDashboard from "./pages/PublicDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const isPasswordRecoveryEntry = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    window.location.pathname === '/reset-password' ||
    sessionStorage.getItem('password_recovery_active') === '1' ||
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery'
  );
};

const PasswordRecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPasswordRecovery, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && isPasswordRecovery && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
    }
  }, [isPasswordRecovery, loading, location.pathname, navigate]);

  return null;
};

const App = () => {
  const [showIntro, setShowIntro] = useState(() => {
    const seen = sessionStorage.getItem('intro_seen');
    return !seen && !isPasswordRecoveryEntry();
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('intro_seen', '1');
    setShowIntro(false);
  }, []);

  useEffect(() => {
    if (isPasswordRecoveryEntry()) {
      setShowIntro(false);
    }
  }, []);

  return (
    <>
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <PasswordRecoveryRedirect />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<PublicDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/gestor" element={<GestorDashboard />} />
                <Route path="/gestor/carbon" element={<GestorCarbonPage />} />
                <Route path="/motorista" element={<MotoristaDashboard />} />
                <Route path="/autonomo" element={<AutonomoDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
