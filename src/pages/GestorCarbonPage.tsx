import { useEffect, useState } from 'react';
import logoImg from '@/assets/logo-viniferasense.png';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarbonOverviewTab } from '@/components/carbon/CarbonOverviewTab';
import { CarbonTripsTab } from '@/components/carbon/CarbonTripsTab';
import { CarbonComparatorTab } from '@/components/carbon/CarbonComparatorTab';
import { CarbonReportsTab } from '@/components/carbon/CarbonReportsTab';
import { CarbonSettingsTab } from '@/components/carbon/CarbonSettingsTab';
import {
  LogOut,
  LayoutDashboard,
  Cloud,
  BarChart3,
  Route,
  ArrowLeftRight,
  FileText,
  Settings,
  Menu,
  X,
  Loader2,
  Pencil,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GestorCarbonPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, updateProfileName } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState(profile?.nome ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile) {
        navigate('/setup');
      } else if (profile.tipo !== 'gestor') {
        navigate('/motorista');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Até logo!');
    }
  };

  const handleOpenProfileDialog = () => {
    setProfileName(profile?.nome ?? '');
    setProfileDialogOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = profileName.trim();
    if (cleanName.length < 2) {
      toast.error('Informe um nome com pelo menos 2 caracteres');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await updateProfileName(cleanName);
      if (error) {
        toast.error('Erro ao atualizar nome: ' + error.message);
        return;
      }

      toast.success('Nome atualizado!');
      setProfileDialogOpen(false);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'trips', label: 'Por Viagem', icon: Route },
    { id: 'comparator', label: 'Comparador', icon: ArrowLeftRight },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Logo size="sm" variant="dark" />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenProfileDialog}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span>
                  Olá, <span className="font-medium text-foreground">{profile?.nome}</span>
                </span>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenProfileDialog}
                className="h-9 w-9 sm:hidden"
                aria-label="Editar nome"
              >
                <Pencil className="h-4 w-4" />
              </Button>
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

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar nome</DialogTitle>
            <DialogDescription>
              Esse nome aparece no topo da sua dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carbon-profile-name" className="text-foreground">Nome de usuário</Label>
              <Input
                id="carbon-profile-name"
                type="text"
                placeholder="Seu nome"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-12 bg-background border-input"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold gradient-vs-primary hover:opacity-90 transition-opacity"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar nome'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-[73px] left-0 z-40 h-[calc(100vh-73px)] w-64 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 space-y-2">
            <Link to="/gestor">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
            </Link>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <Cloud className="h-5 w-5 text-primary" />
                <span className="font-semibold">Carbono (CO₂)</span>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      activeTab === tab.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)]">
          <div className="container py-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Cloud className="h-6 w-6 text-primary" />
                Carbono (CO₂)
              </h1>
              <p className="text-muted-foreground">
                Monitoramento de emissões de transporte rodoviário
              </p>
            </div>

            {/* Mobile Tabs */}
            <div className="lg:hidden mb-6 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="whitespace-nowrap gap-2"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="pb-8">
              {activeTab === 'overview' && <CarbonOverviewTab />}
              {activeTab === 'trips' && <CarbonTripsTab />}
              {activeTab === 'comparator' && <CarbonComparatorTab />}
              {activeTab === 'reports' && <CarbonReportsTab />}
              {activeTab === 'settings' && <CarbonSettingsTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GestorCarbonPage;
