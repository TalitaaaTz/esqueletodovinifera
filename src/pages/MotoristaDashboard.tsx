import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo-viniferasense.png';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSensorData } from '@/hooks/useSensorData';
import { useTrips } from '@/hooks/useTrips';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { CargoStatusCard } from '@/components/dashboard/CargoStatusCard';
import { CountdownTimer } from '@/components/dashboard/CountdownTimer';
import { RouteInfoCard } from '@/components/dashboard/RouteInfoCard';
import { TripChecklist } from '@/components/motorista/TripChecklist';
import { TripCodeEntry } from '@/components/motorista/TripCodeEntry';
import { AlertsPanel } from '@/components/motorista/AlertsPanel';
import { TripEvents } from '@/components/motorista/TripEvents';
import { CargoStatusPanel } from '@/components/motorista/CargoStatusPanel';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  Thermometer,
  Droplets,
  Zap,
  MessageCircle,
  Navigation,
  LayoutDashboard,
  CheckCircle,
} from 'lucide-react';
import {
  formatSensorNumber,
  formatSensorText,
  getRangeVariant,
  getVibrationVariant,
} from '@/lib/sensorData';

const NavigationMapCard = lazy(() => import('@/components/navigation/NavigationMapCard'));

type ViewMode = 'dashboard' | 'navigation';

const MotoristaDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | undefined>(undefined);
  const {
    data,
    loading: dataLoading,
    cargoStatus,
    qualityScore,
    refresh,
    error: sensorError,
  } = useSensorData(linkedDeviceId);
  const { activeTrip, events, createTrip, updateTrip, addEvent, fetchEvents, fetchTrips } = useTrips();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [loadedTrip, setLoadedTrip] = useState<any>(null);

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
      if (!user) {
        navigate('/auth');
      } else if (!profile) {
        navigate('/setup');
      } else if (profile.tipo !== 'motorista') {
        navigate('/gestor');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (activeTrip) {
      fetchEvents(activeTrip.id);
    }
  }, [activeTrip, fetchEvents]);

  const handleStartTrip = useCallback(
    async (checklist: Record<string, boolean>) => {
      if (loadedTrip) {
        await updateTrip(loadedTrip.id, {
          ...checklist,
          motorista_id: user!.id,
          status: 'em_andamento',
        });
        await addEvent(loadedTrip.id, 'inicio_viagem');
        setLoadedTrip(null);
        await fetchTrips();
      } else {
        const routeParts = data?.rota ? data.rota.split(/\s*(?:->|→)\s*/) : [];
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
      }
    },
    [loadedTrip, createTrip, addEvent, updateTrip, fetchTrips, data, user]
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
      <DashboardHeader variant="motorista" onRefresh={refresh} />

      <main className="container py-4">
        <div className="flex gap-2 mb-4">
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

        {viewMode === 'navigation' ? (
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center bg-muted/30 rounded-xl"
                style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            }
          >
            <NavigationMapCard cargoStatus={cargoStatus} />
          </Suspense>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeTrip ? 'Viagem em Andamento' : 'Pre-Viagem'}
              </h1>
              <p className="text-muted-foreground">
                {activeTrip ? 'Acompanhe sua carga em tempo real' : 'Complete o checklist para iniciar a viagem'}
              </p>
            </div>

            {!activeTrip && !loadedTrip && (
              <>
                <TripCodeEntry onTripLoaded={(trip) => setLoadedTrip(trip)} />
                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <TripChecklist onStartTrip={handleStartTrip} />
              </>
            )}

            {!activeTrip && loadedTrip && (
              <>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                  <p className="text-sm font-medium text-primary">Viagem carregada: {loadedTrip.trip_code}</p>
                  <p className="text-sm text-muted-foreground">
                    {loadedTrip.caminhao} {' - '} {loadedTrip.origem} {' -> '} {loadedTrip.destino} {' - '} {loadedTrip.tipo_carga}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setLoadedTrip(null)} className="text-xs">
                    Trocar viagem
                  </Button>
                </div>
                <TripChecklist onStartTrip={handleStartTrip} />
              </>
            )}

            {activeTrip && (
              <>
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

                <Button
                  variant="outline"
                  className="w-full gap-2 border-[hsl(142,70%,40%)] text-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,40%)]/10"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `ViniferaSense - Atualizacao de Viagem\n\n` +
                        `Viagem: ${activeTrip.trip_code || activeTrip.id.slice(0, 8)}\n` +
                        `Rota: ${activeTrip.origem} -> ${activeTrip.destino}\n` +
                        `Caminhao: ${activeTrip.caminhao}\n` +
                        `Carga: ${activeTrip.tipo_carga || 'N/A'}\n` +
                        `Status: ${cargoStatus === 'saudavel' ? 'Saudavel' : cargoStatus === 'atencao' ? 'Atencao' : 'Critico'}\n` +
                        (data
                          ? `Temp: ${formatSensorNumber(data.temperatura, 1)}°C | Umidade: ${formatSensorNumber(data.umidade, 0)}%`
                          : '')
                    );
                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar status ao Gestor via WhatsApp
                </Button>

                {dataLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : data ? (
                  <div className="space-y-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <SensorCard
                        title="Temperatura"
                        value={formatSensorNumber(data.temperatura, 1)}
                        unit="°C"
                        icon={<Thermometer className="h-6 w-6" />}
                        variant={getRangeVariant(data.temperatura, 2, 6)}
                      />

                      <SensorCard
                        title="Umidade"
                        value={formatSensorNumber(data.umidade, 0)}
                        unit="%"
                        icon={<Droplets className="h-6 w-6" />}
                        variant={getRangeVariant(data.umidade, 80, 92)}
                      />

                      <SensorCard
                        title="Vibracao"
                        value={formatSensorText(data.vibracao)}
                        icon={<Zap className="h-6 w-6" />}
                        variant={getVibrationVariant(data.vibracao)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Aguardando dados dos sensores...</p>
                    {sensorError && <p className="mt-2 text-xs text-muted-foreground/80">{sensorError}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MotoristaDashboard;
