import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '@/assets/logo-viniferasense.png';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSensorData } from '@/hooks/useSensorData';
import { useTrips } from '@/hooks/useTrips';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { QualityScoreCard } from '@/components/dashboard/QualityScoreCard';
import { RiskLevelCard } from '@/components/dashboard/RiskLevelCard';
import { BeaconsCard } from '@/components/dashboard/BeaconsCard';
import { FleetMonitoring } from '@/components/gestor/FleetMonitoring';
import { TripCreation } from '@/components/gestor/TripCreation';
import { TripsList } from '@/components/gestor/TripsList';
import { TripHistory } from '@/components/gestor/TripHistory';
import { ReportsPanel } from '@/components/gestor/ReportsPanel';
import { BeaconSelector } from '@/components/beacon/BeaconSelector';
import { Button } from '@/components/ui/button';
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
  Cloud,
  ArrowRight,
  Signal,
} from 'lucide-react';

const GestorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuthContext();
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | undefined>(undefined);
  const { data, loading: dataLoading, riskLevel, qualityScore, refresh, error: sensorError } =
    useSensorData(linkedDeviceId);
  const { trips, createTrip, loading: tripsLoading } = useTrips();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!profile) {
        navigate('/setup');
      } else if (profile.tipo !== 'gestor') {
        navigate(profile.tipo === 'autonomo' ? '/autonomo' : '/motorista');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img src={logoImg} alt="ViniferaSense" className="h-16 w-16 object-contain" />
        </div>
      </div>
    );
  }

  const handleCreateTrip = async (tripData: any) => {
    return createTrip({
      ...tripData,
      gestor_id: user?.id,
      motorista_id: user?.id,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader variant="gestor" onRefresh={refresh} />

      <main className="container py-6 space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:p-8">
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
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Painel de Controle</h1>
              <p className="text-muted-foreground mt-1">Monitoramento em tempo real - Atualizado a cada 5s</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <TripCreation onCreateTrip={handleCreateTrip} loading={tripsLoading} />
              <TripHistory trips={trips} />
              <Link to="/gestor/carbon">
                <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-vs-glow">
                  <Cloud className="h-4 w-4" />
                  Carbono (CO2)
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <BeaconSelector selectedDeviceId={linkedDeviceId} onSelect={(code) => setLinkedDeviceId(code)} />
          </div>
        </div>

        <FleetMonitoring trips={trips} />

        {dataLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <QualityScoreCard score={qualityScore} />
              <RiskLevelCard level={riskLevel} />
            </div>

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
            <p>Selecione ou vincule um beacon para ver os dados dos sensores</p>
            {sensorError && <p className="mt-2 text-xs text-muted-foreground/80">{sensorError}</p>}
          </div>
        )}

        <ReportsPanel trips={trips} />
        <TripsList trips={trips} />
      </main>
    </div>
  );
};

export default GestorDashboard;
