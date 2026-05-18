import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Palette,
  Leaf,
  Zap,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { useSensorData } from '@/hooks/useSensorData';
import { CargoStatusCard } from '@/components/dashboard/CargoStatusCard';
import { QualityScoreCard } from '@/components/dashboard/QualityScoreCard';
import { RiskLevelCard } from '@/components/dashboard/RiskLevelCard';
import { RouteInfoCard } from '@/components/dashboard/RouteInfoCard';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import {
  formatSensorNumber,
  formatSensorText,
  getRangeVariant,
  getThresholdVariant,
  getVibrationVariant,
} from '@/lib/sensorData';

const PublicDashboard = () => {
  const { data, loading: dataLoading, riskLevel, cargoStatus, qualityScore, refresh } = useSensorData();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen gradient-vs-light">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Area Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoramento em Tempo Real</h1>
          <p className="text-muted-foreground">Dados atualizados automaticamente a cada 5 segundos</p>
        </div>

        {dataLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-card/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CargoStatusCard status={cargoStatus} />
              <QualityScoreCard score={qualityScore} />
              <RiskLevelCard level={riskLevel} />
            </div>

            <RouteInfoCard
              rota={data.rota || 'Nao definida'}
              veiculo={data.veiculo || 'Nao definido'}
              carga={data.carga || 'Nao definida'}
            />

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
                value={
                  data.indice_cor !== null && Number.isFinite(data.indice_cor)
                    ? (data.indice_cor * 100).toFixed(0)
                    : '—'
                }
                unit="%"
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

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Ultima atualizacao</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(data.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum dado disponivel</p>
            <p className="text-sm mt-2">{'Aguardando dados do ESP32...'}</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          ViniferaSense Smart Logistics - Monitoramento IoT em Tempo Real
        </div>
      </footer>
    </div>
  );
};

export default PublicDashboard;
