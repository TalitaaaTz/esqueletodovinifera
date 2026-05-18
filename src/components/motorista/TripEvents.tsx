import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  PauseCircle,
  Wind,
  Search,
  MapPin,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TripEvent } from '@/hooks/useTrips';

const EVENT_TYPES = [
  { tipo: 'inicio_viagem', label: 'Início da Viagem', icon: Play, color: 'text-[hsl(var(--vs-healthy))]' },
  { tipo: 'parada_tecnica', label: 'Parada Técnica', icon: PauseCircle, color: 'text-[hsl(var(--vs-warning))]' },
  { tipo: 'purga_etileno', label: 'Purga de Etileno', icon: Wind, color: 'text-[hsl(var(--vs-info))]' },
  { tipo: 'inspecao_carga', label: 'Inspeção da Carga', icon: Search, color: 'text-primary' },
  { tipo: 'chegada_destino', label: 'Chegada ao Destino', icon: MapPin, color: 'text-[hsl(var(--vs-healthy))]' },
];

interface TripEventsProps {
  tripId: string | null;
  events: TripEvent[];
  onAddEvent: (tripId: string, tipo: string) => Promise<any>;
  loading?: boolean;
}

export function TripEvents({ tripId, events, onAddEvent, loading }: TripEventsProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleAdd = async (tipo: string) => {
    if (!tripId) return;
    setSubmitting(tipo);
    await onAddEvent(tripId, tipo);
    setSubmitting(null);
  };

  const getEventMeta = (tipo: string) => EVENT_TYPES.find(e => e.tipo === tipo);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Eventos da Viagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        {tripId && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_TYPES.map(({ tipo, label, icon: Icon, color }) => (
              <Button
                key={tipo}
                variant="outline"
                size="sm"
                onClick={() => handleAdd(tipo)}
                disabled={loading || submitting === tipo}
                className="gap-1.5 text-xs h-auto py-2.5"
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </Button>
            ))}
          </div>
        )}

        {!tripId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Inicie uma viagem para registrar eventos
          </p>
        )}

        {/* Event timeline */}
        {events.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Histórico
            </h4>
            {events.map((event) => {
              const meta = getEventMeta(event.tipo);
              const EventIcon = meta?.icon || Clock;
              return (
                <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  <EventIcon className={`h-4 w-4 ${meta?.color || 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{meta?.label || event.tipo}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {format(new Date(event.created_at), 'HH:mm', { locale: ptBR })}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
