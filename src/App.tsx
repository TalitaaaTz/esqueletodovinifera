import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import IntroSplash from "@/components/IntroSplash";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import GestorDashboard from "./pages/GestorDashboard";
import GestorCarbonPage from "./pages/GestorCarbonPage";
import MotoristaDashboard from "./pages/MotoristaDashboard";
import AutonomoDashboard from "./pages/AutonomoDashboard";
import PublicDashboard from "./pages/PublicDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showIntro, setShowIntro] = useState(() => {
    const seen = sessionStorage.getItem('intro_seen');
    return !seen;
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('intro_seen', '1');
    setShowIntro(false);
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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<PublicDashboard />} />
                <Route path="/auth" element={<Auth />} />
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
