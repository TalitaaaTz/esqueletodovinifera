import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Droplets, Wind, Zap, BarChart3 } from 'lucide-react';

interface CargoStatusPanelProps {
  temperatura: number | null | undefined;
  umidade: number | null | undefined;
  co2: number | null | undefined;
  vibracao: string | null | undefined;
  qualityScore: number | null | undefined;
}

function StatusIndicator({ value, ideal, unit, icon, label }: {
  value: string;
  ideal: boolean;
  unit?: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className={`p-3 rounded-lg border ${ideal ? 'border-[hsl(var(--vs-healthy))]/30 bg-[hsl(var(--vs-healthy))]/5' : 'border-[hsl(var(--vs-warning))]/30 bg-[hsl(var(--vs-warning))]/5'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-mono-data">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className={`mt-1 h-1 rounded-full ${ideal ? 'bg-[hsl(var(--vs-healthy))]' : 'bg-[hsl(var(--vs-warning))]'}`} />
    </div>
  );
}

export function CargoStatusPanel({ temperatura, umidade, co2, vibracao, qualityScore }: CargoStatusPanelProps) {
  const safeTemperatura = typeof temperatura === 'number' && Number.isFinite(temperatura) ? temperatura : null;
  const safeUmidade = typeof umidade === 'number' && Number.isFinite(umidade) ? umidade : null;
  const safeCo2 = typeof co2 === 'number' && Number.isFinite(co2) ? co2 : null;
  const safeVibracao = typeof vibracao === 'string' && vibracao.trim().length > 0 ? vibracao : '—';
  const safeQualityScore = typeof qualityScore === 'number' && Number.isFinite(qualityScore)
    ? Math.max(0, Math.min(100, qualityScore))
    : 0;

  const getScoreColor = () => {
    if (safeQualityScore >= 80) return 'text-[hsl(var(--vs-healthy))]';
    if (safeQualityScore >= 50) return 'text-[hsl(var(--vs-warning))]';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Status da Carga
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatusIndicator
            label="Temperatura"
            value={safeTemperatura !== null ? safeTemperatura.toFixed(1) : '—'}
            unit="°C"
            ideal={safeTemperatura !== null && safeTemperatura >= 2 && safeTemperatura <= 6}
            icon={<Thermometer className="h-4 w-4 text-muted-foreground" />}
          />
          <StatusIndicator
            label="Umidade"
            value={safeUmidade !== null ? safeUmidade.toFixed(0) : '—'}
            unit="%"
            ideal={safeUmidade !== null && safeUmidade >= 80 && safeUmidade <= 92}
            icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
          />
          <StatusIndicator
            label="Etileno/CO₂"
            value={safeCo2 !== null ? safeCo2.toString() : '—'}
            unit="ppm"
            ideal={safeCo2 !== null && safeCo2 <= 450}
            icon={<Wind className="h-4 w-4 text-muted-foreground" />}
          />
          <StatusIndicator
            label="Vibração"
            value={safeVibracao}
            ideal={safeVibracao === 'OK' || safeVibracao === 'Baixa'}
            icon={<Zap className="h-4 w-4 text-muted-foreground" />}
          />
          <div className="col-span-2 sm:col-span-1 p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Qualidade</span>
            </div>
            <div className={`text-2xl font-bold font-mono-data ${getScoreColor()}`}>
              {safeQualityScore}
              <span className="text-xs text-muted-foreground font-normal">/100</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${safeQualityScore >= 80 ? 'bg-[hsl(var(--vs-healthy))]' : safeQualityScore >= 50 ? 'bg-[hsl(var(--vs-warning))]' : 'bg-destructive'}`}
                style={{ width: `${safeQualityScore}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
