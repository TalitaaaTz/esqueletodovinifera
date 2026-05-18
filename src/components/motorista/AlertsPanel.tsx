import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Thermometer, Zap, Wind, Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AlertItem {
  id: string;
  tipo: 'critico' | 'atencao' | 'info';
  titulo: string;
  causa: string;
  acao: string;
  icon: React.ReactNode;
}

interface AlertsPanelProps {
  temperatura: number;
  umidade: number;
  co2: number | null | undefined;
  vibracao: string | null | undefined;
}

const isCriticalVibration = (value: string | null | undefined) => {
  return value === 'Critica' || value === 'Crítica' || value === 'CrÃ­tica';
};

export function AlertsPanel({ temperatura, umidade, co2, vibracao }: AlertsPanelProps) {
  const alerts: AlertItem[] = [];
  const hasCo2 = typeof co2 === 'number' && Number.isFinite(co2);

  if (temperatura > 8) {
    alerts.push({
      id: 'temp-high',
      tipo: 'critico',
      titulo: 'Temperatura elevada',
      causa: 'Falha na refrigeracao ou porta aberta',
      acao: 'Verificar sistema de refrigeracao imediatamente',
      icon: <Thermometer className="h-6 w-6" />,
    });
  } else if (temperatura > 6) {
    alerts.push({
      id: 'temp-warn',
      tipo: 'atencao',
      titulo: 'Temperatura acima do ideal',
      causa: 'Variacao termica do ambiente',
      acao: 'Monitorar e ajustar termostato',
      icon: <Thermometer className="h-6 w-6" />,
    });
  }

  if (vibracao === 'Alta' || isCriticalVibration(vibracao)) {
    alerts.push({
      id: 'vib-high',
      tipo: isCriticalVibration(vibracao) ? 'critico' : 'atencao',
      titulo: 'Vibracao excessiva',
      causa: 'Estrada irregular ou problema na suspensao',
      acao: 'Reduzir velocidade e verificar estrada',
      icon: <Zap className="h-6 w-6" />,
    });
  }

  if (hasCo2 && co2 > 600) {
    alerts.push({
      id: 'co2-high',
      tipo: 'critico',
      titulo: 'Etileno/CO2 alto',
      causa: 'Amadurecimento acelerado da carga',
      acao: 'Realizar purga da carga',
      icon: <Wind className="h-6 w-6" />,
    });
  } else if (hasCo2 && co2 > 450) {
    alerts.push({
      id: 'co2-warn',
      tipo: 'atencao',
      titulo: 'CO2 acima do ideal',
      causa: 'Respiracao elevada da carga',
      acao: 'Verificar ventilacao do bau',
      icon: <Wind className="h-6 w-6" />,
    });
  }

  if (umidade < 75) {
    alerts.push({
      id: 'hum-low',
      tipo: 'atencao',
      titulo: 'Umidade baixa',
      causa: 'Desidratacao do ar no bau',
      acao: 'Verificar sistema de umidificacao',
      icon: <Info className="h-6 w-6" />,
    });
  }

  const getAlertBg = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-destructive/10 border-destructive/40 shadow-[0_0_20px_-4px_hsl(var(--destructive)/0.3)]';
      case 'atencao':
        return 'bg-[hsl(var(--vs-warning))/0.1] border-[hsl(var(--vs-warning))]/40 shadow-[0_0_20px_-4px_hsl(var(--vs-warning)/0.3)]';
      default:
        return 'bg-[hsl(var(--vs-info))/0.1] border-[hsl(var(--vs-info))]/40';
    }
  };

  const getIconBg = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-destructive text-destructive-foreground';
      case 'atencao':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getBadgeStyle = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'bg-destructive text-destructive-foreground animate-pulse font-bold';
      case 'atencao':
        return 'bg-amber-500 text-white font-bold';
      default:
        return 'bg-blue-500 text-white font-bold';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <span className="text-lg font-semibold text-emerald-600">
              Tudo normal - nenhum alerta ativo
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-destructive/30 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 bg-destructive/5">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-destructive flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
          </div>
          <span>Alertas Ativos</span>
          <Badge className="ml-auto text-sm px-3 py-1 bg-destructive text-destructive-foreground animate-pulse">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-xl border-2 transition-all ${getAlertBg(alert.tipo)}`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 p-2.5 rounded-xl ${getIconBg(alert.tipo)} shrink-0`}>
                {alert.icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-base text-foreground">{alert.titulo}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${getBadgeStyle(alert.tipo)}`}>
                    {alert.tipo === 'critico' ? 'CRITICO' : 'ATENCAO'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Causa:</strong> {alert.causa}
                </p>
                <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3 mt-1">
                  <span className="text-primary font-bold text-sm shrink-0">Acao:</span>
                  <span className="text-sm font-semibold text-primary">{alert.acao}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
