import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingDown, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import type { Trip } from '@/hooks/useTrips';

interface ReportsPanelProps {
  trips: Trip[];
}

export function ReportsPanel({ trips }: ReportsPanelProps) {
  const completedTrips = trips.filter(t => t.status === 'concluida').length;
  const activeTrips = trips.filter(t => t.status === 'em_andamento').length;
  const totalTrips = trips.length;
  const avgScore = trips.length > 0
    ? Math.round(trips.reduce((sum, t) => sum + (t.quality_score || 75), 0) / trips.length)
    : 0;
  const alertTrips = trips.filter(t => (t.quality_score || 100) < 60).length;
  const lossAvoided = completedTrips * 1250;

  const metrics = [
    { label: 'Viagens Realizadas', value: completedTrips, icon: CheckCircle, color: 'text-[hsl(var(--vs-healthy))]', bg: 'bg-[hsl(var(--vs-healthy))]/10', border: 'border-[hsl(var(--vs-healthy))]/20' },
    { label: 'Viagens Ativas', value: activeTrips, icon: Activity, color: 'text-[hsl(var(--vs-info))]', bg: 'bg-[hsl(var(--vs-info))]/10', border: 'border-[hsl(var(--vs-info))]/20' },
    { label: 'Alertas Gerados', value: alertTrips, icon: AlertTriangle, color: 'text-[hsl(var(--vs-warning))]', bg: 'bg-[hsl(var(--vs-warning))]/10', border: 'border-[hsl(var(--vs-warning))]/20' },
    { label: 'Score Médio', value: avgScore, icon: TrendingDown, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', suffix: '/100' },
  ];

  return (
    <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Relatórios
          </CardTitle>
          <Badge variant="outline" className="text-xs font-mono-data">
            {totalTrips} viagens
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className={`p-4 rounded-xl ${m.bg} border ${m.border} text-center transition-all hover:scale-[1.02]`}>
              <m.icon className={`h-5 w-5 mx-auto mb-2 ${m.color}`} />
              <p className="text-2xl font-bold font-mono-data">
                {m.value}{m.suffix || ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Perdas Evitadas */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-[hsl(var(--vs-healthy))]/10 border border-[hsl(var(--vs-healthy))]/30 shadow-[0_0_20px_-10px_hsl(var(--vs-healthy)/0.25)]">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[hsl(var(--vs-healthy))]/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--vs-healthy))]/15">
                <TrendingDown className="h-4 w-4 text-[hsl(var(--vs-healthy))]" />
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--vs-healthy))] uppercase tracking-wider">Perdas Evitadas</span>
              <span className="text-[10px] text-muted-foreground">(estimativa)</span>
            </div>
            <p className="text-3xl font-bold font-mono-data text-[hsl(var(--vs-healthy))]">
              R$ {lossAvoided.toLocaleString('pt-BR')}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-[hsl(var(--vs-healthy))] border-[hsl(var(--vs-healthy))]/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedTrips} viagens protegidas
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
