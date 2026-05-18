import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo-viniferasense.png';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSensorData } from '@/hooks/useSensorData';
import { useTrips } from '@/hooks/useTrips';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { QualityScoreCard } from '@/components/dashboard/QualityScoreCard';
import { RiskLevelCard } from '@/components/dashboard/RiskLevelCard';
import { BeaconsCard } from '@/components/dashboard/BeaconsCard';
import { CargoStatusCard } from '@/components/dashboard/CargoStatusCard';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { RouteInfoCard } from '@/components/dashboard/RouteInfoCard';
import { TripChecklist } from '@/components/motorista/TripChecklist';
import { TripEvents } from '@/components/motorista/TripEvents';
import { AlertsPanel } from '@/components/motorista/AlertsPanel';
import { CargoStatusPanel } from '@/components/motorista/CargoStatusPanel';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  formatSensorNumber,
  formatSensorText,
  getRangeVariant,
  getThresholdVariant,
  getVibrationVariant,
} from '@/lib/sensorData';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Palette,
  Leaf,
  Zap,
  Signal,
  Navigation,
  LayoutDashboard,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const NavigationMapCard = lazy(() => import('@/components/navigation/NavigationMapCard'));

type ViewMode = 'dashboard' | 'navigation';

const AutonomoDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | undefined>(undefined);
  const {
    data,
    loading: dataLoading,
    error: sensorError,
    riskLevel,
    cargoStatus,
    qualityScore,
    refresh,
  } = useSensorData(linkedDeviceId);
  const { activeTrip, events, createTrip, updateTrip, addEvent, fetchEvents } = useTrips();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  useEffect(() => {
    const fetchLinkedDevice = async () => {
      if (user) {
        const { data: devices } = await supabase
          .from('user_devices')
          .select('device_code')
          .eq('user_id', user.id)
          .limit(1);

        if (devices && devices.length > 0) {
          setLinkedDeviceId(devices[0].device_code);
        }
      }
    };

    fetchLinkedDevice();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth');
      else if (!profile) navigate('/setup');
      else if (profile.tipo !== 'autonomo') {
        navigate(profile.tipo === 'gestor' ? '/gestor' : '/motorista');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    if (activeTrip) fetchEvents(activeTrip.id);
  }, [activeTrip, fetchEvents]);

  const handleStartTrip = useCallback(
    async (checklist: Record<string, boolean>) => {
      const routeParts = data?.rota?.split(' -> ') ?? data?.rota?.split(' → ') ?? [];
      const trip = await createTrip({
        ...checklist,
        caminhao: data?.veiculo || 'N/A',
        origem: routeParts[0] || '',
        destino: routeParts[1] || '',
        tipo_carga: 'Frutas',
        status: 'em_andamento',
      } as any);

      if (trip) {
        await addEvent(trip.id, 'inicio_viagem');
      }
    },
    [createTrip, addEvent, data]
  );

  const handleFinishTrip = useCallback(async () => {
    if (!activeTrip) return;
    await addEvent(activeTrip.id, 'chegada_destino');
    await updateTrip(activeTrip.id, { status: 'concluida' });
  }, [activeTrip, addEvent, updateTrip]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader variant="gestor" onRefresh={refresh} />

      <main className="container py-6 space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 lg:p-8">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--vs-healthy))]/15 border border-[hsl(var(--vs-healthy))]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--vs-healthy))] animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--vs-healthy))]">
                    Ao vivo
                  </span>
                </div>
                {linkedDeviceId && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/20">
                    <Signal className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      Beacon {linkedDeviceId}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Painel Autonomo</h1>
              <p className="text-muted-foreground mt-1">Monitoramento e gestao de viagem - Atualizado a cada 5s</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={viewMode === 'navigation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('navigation')}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Navegacao
              </Button>
            </div>
          </div>
        </div>

        {viewMode === 'navigation' ? (
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center bg-muted/30 rounded-xl"
                style={{ height: 'calc(100vh - 240px)', minHeight: '400px' }}
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            }
          >
            <NavigationMapCard cargoStatus={cargoStatus} />
          </Suspense>
        ) : (
          <>
            {!activeTrip ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pre-viagem</h2>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <TripChecklist onStartTrip={handleStartTrip} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Viagem em andamento
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFinishTrip}
                    className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Finalizar Viagem
                  </Button>
                </div>
              </div>
            )}

            {dataLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 bg-card/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <QualityScoreCard score={qualityScore} />
                  <RiskLevelCard level={riskLevel} />
                </div>

                {activeTrip && (
                  <>
                    <CargoStatusCard status={cargoStatus} />
                    <CargoStatusPanel
                      temperatura={data.temperatura}
                      umidade={data.umidade}
                      co2={data.co2}
                      vibracao={data.vibracao}
                      qualityScore={qualityScore}
                    />
                    <AlertsPanel
                      temperatura={data.temperatura}
                      umidade={data.umidade}
                      co2={data.co2}
                      vibracao={data.vibracao}
                    />
                    <RouteInfoCard rota={data.rota} veiculo={data.veiculo} carga={data.carga} />
                    <CountdownTimer />
                    <TripEvents tripId={activeTrip.id} events={events} onAddEvent={addEvent} />
                  </>
                )}

                <div className="flex items-center gap-3">
                  <Signal className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Sensores Primarios
                  </h2>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SensorCard
                    title="Temperatura"
                    value={formatSensorNumber(data.temperatura, 1)}
                    unit="°C"
                    icon={<Thermometer className="h-5 w-5" />}
                    variant={getRangeVariant(data.temperatura, 2, 6)}
                  />
                  <SensorCard
                    title="Umidade"
                    value={formatSensorNumber(data.umidade, 0)}
                    unit="%"
                    icon={<Droplets className="h-5 w-5" />}
                    variant={getRangeVariant(data.umidade, 80, 92)}
                  />
                  <SensorCard
                    title="CO2"
                    value={data.co2 ?? '—'}
                    unit="ppm"
                    icon={<Wind className="h-5 w-5" />}
                    variant={getThresholdVariant(data.co2, 450)}
                  />
                  <SensorCard
                    title="Respiracao"
                    value={formatSensorNumber(data.respiracao, 1)}
                    unit="mg/kg/h"
                    icon={<Activity className="h-5 w-5" />}
                  />
                  <SensorCard
                    title="Indice de Maturacao"
                    value={formatSensorNumber(data.indice_cor, 2)}
                    icon={<Palette className="h-5 w-5" />}
                  />
                  <SensorCard
                    title="Estagio Fisiologico"
                    value={formatSensorText(data.estagio)}
                    icon={<Leaf className="h-5 w-5" />}
                  />
                  <SensorCard
                    title="Vibracao"
                    value={formatSensorText(data.vibracao)}
                    icon={<Zap className="h-5 w-5" />}
                    variant={getVibrationVariant(data.vibracao)}
                  />
                </div>

                <BeaconsCard
                  microclima2Temp={data.microclima2_temp}
                  microclima2Umidade={data.microclima2_umidade}
                  temperaturaCarga={data.temperatura_carga}
                />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum dado disponivel do beacon</p>
                {sensorError && <p className="mt-2 text-xs text-muted-foreground/80">{sensorError}</p>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AutonomoDashboard;
