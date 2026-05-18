import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, AlertTriangle, CheckCircle, Activity, X, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Trip } from '@/hooks/useTrips';

interface FleetMonitoringProps {
  trips: Trip[];
}

type FilterType = 'total' | 'operacao' | 'alertas' | 'normais' | null;

export function FleetMonitoring({ trips }: FleetMonitoringProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const activeTrips = trips.filter(t => t.status === 'em_andamento');
  const uniqueTrucks = [...new Set(trips.map(t => t.caminhao).filter(Boolean))];
  const activeTrucks = [...new Set(activeTrips.map(t => t.caminhao).filter(Boolean))];
  const trucksWithAlerts = activeTrips.filter(t => (t.quality_score || 100) < 60);
  const trucksNormal = activeTrips.filter(t => (t.quality_score || 100) >= 60);

  const stats = [
    { key: 'total' as FilterType, label: 'Total Caminhões', value: uniqueTrucks.length || 0, icon: Truck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', activeBorder: 'border-primary' },
    { key: 'operacao' as FilterType, label: 'Em Operação', value: activeTrucks.length || 0, icon: Activity, color: 'text-vs-info', bg: 'bg-vs-info/10', border: 'border-vs-info/20', activeBorder: 'border-vs-info' },
    { key: 'alertas' as FilterType, label: 'Com Alertas', value: trucksWithAlerts.length || 0, icon: AlertTriangle, color: 'text-vs-warning', bg: 'bg-vs-warning/10', border: 'border-vs-warning/20', activeBorder: 'border-vs-warning' },
    { key: 'normais' as FilterType, label: 'Normais', value: trucksNormal.length || 0, icon: CheckCircle, color: 'text-vs-healthy', bg: 'bg-vs-healthy/10', border: 'border-vs-healthy/20', activeBorder: 'border-vs-healthy' },
  ];

  const getFilteredTrips = (): Trip[] => {
    switch (activeFilter) {
      case 'total':
        return trips;
      case 'operacao':
        return activeTrips;
      case 'alertas':
        return trucksWithAlerts;
      case 'normais':
        return trucksNormal;
      default:
        return [];
    }
  };

  const getFilterLabel = (): string => {
    switch (activeFilter) {
      case 'total': return 'Todos os Caminhões';
      case 'operacao': return 'Em Operação';
      case 'alertas': return 'Com Alertas';
      case 'normais': return 'Normais';
      default: return '';
    }
  };

  const filteredTrips = getFilteredTrips();

  const handleCardClick = (key: FilterType) => {
    setActiveFilter(prev => prev === key ? null : key);
  };

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }> = {
    pendente: { label: 'Pendente', variant: 'secondary', dotColor: 'bg-muted-foreground' },
    em_andamento: { label: 'Em Andamento', variant: 'default', dotColor: 'bg-primary animate-pulse' },
    concluida: { label: 'Concluída', variant: 'outline', dotColor: 'bg-vs-healthy' },
    cancelada: { label: 'Cancelada', variant: 'destructive', dotColor: 'bg-destructive' },
  };

  return (
    <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            Monitoramento da Frota
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono-data">{activeTrips.length} ativas</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => handleCardClick(stat.key)}
              className={`relative overflow-hidden p-5 rounded-xl ${stat.bg} border text-center transition-all hover:scale-[1.02] cursor-pointer ${
                activeFilter === stat.key ? `${stat.activeBorder} border-2 ring-1 ring-${stat.key === 'total' ? 'primary' : stat.key === 'operacao' ? 'vs-info' : stat.key === 'alertas' ? 'vs-warning' : 'vs-healthy'}/30` : stat.border
              }`}
            >
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl font-bold font-mono-data">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Expanded detail panel */}
        {activeFilter && (
          <div className="animate-fade-in border border-border/50 rounded-xl bg-background/30 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="text-sm font-semibold text-foreground">{getFilterLabel()}</h3>
              <button
                onClick={() => setActiveFilter(null)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {filteredTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma viagem nesta categoria</p>
              ) : (
                filteredTrips.map((trip) => {
                  const status = statusMap[trip.status] || statusMap.pendente;
                  return (
                    <div
                      key={trip.id}
                      className="p-3 rounded-lg bg-card/50 border border-border/30 hover:border-border/60 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold">{trip.caminhao || 'N/A'}</span>
                          {trip.trip_code && (
                            <span className="text-xs font-mono-data text-primary">{trip.trip_code}</span>
                          )}
                        </div>
                        <Badge variant={status.variant} className="gap-1 text-[10px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{trip.origem || '—'} → {trip.destino || '—'}</span>
                        </div>
                        {trip.data_saida && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(trip.data_saida), "dd/MM HH:mm", { locale: ptBR })}</span>
                          </div>
                        )}
                        {trip.quality_score != null && (
                          <span className={`font-mono-data font-semibold ${
                            trip.quality_score >= 80 ? 'text-vs-healthy' : trip.quality_score >= 60 ? 'text-vs-warning' : 'text-destructive'
                          }`}>
                            {trip.quality_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
