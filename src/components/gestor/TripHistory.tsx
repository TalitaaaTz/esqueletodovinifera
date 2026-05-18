import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Route, MapPin, Clock, Truck, Weight, ChevronDown, ChevronUp, Package, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { Trip, TripEvent } from '@/hooks/useTrips';

interface TripHistoryProps {
  trips: Trip[];
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }> = {
  pendente: { label: 'Pendente', variant: 'secondary', dotColor: 'bg-muted-foreground' },
  em_andamento: { label: 'Em Andamento', variant: 'default', dotColor: 'bg-primary animate-pulse' },
  concluida: { label: 'Concluída', variant: 'outline', dotColor: 'bg-vs-healthy' },
  cancelada: { label: 'Cancelada', variant: 'destructive', dotColor: 'bg-destructive' },
};

function TripDetailCard({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('trip_events')
        .select('*')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setEvents((data as TripEvent[]) || []);
    } catch (e) {
      console.error('Error fetching trip events:', e);
    } finally {
      setLoadingEvents(false);
    }
  }, [trip.id]);

  useEffect(() => {
    if (expanded && events.length === 0) {
      fetchEvents();
    }
  }, [expanded, fetchEvents, events.length]);

  const status = statusMap[trip.status] || statusMap.pendente;

  const checklistItems = [
    { label: 'Carga conferida', done: trip.checklist_carga_conferida },
    { label: 'Sensores instalados', done: trip.checklist_sensores_instalados },
    { label: 'Sistema ligado', done: trip.checklist_sistema_ligado },
    { label: 'Refrigeração verificada', done: trip.checklist_refrigeracao_verificada },
    { label: 'Rota carregada', done: trip.checklist_rota_carregada },
  ];
  const checklistDone = checklistItems.filter(c => c.done).length;

  return (
    <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden transition-colors hover:border-border/50">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{trip.caminhao || 'N/A'}</span>
            {trip.trip_code && (
              <span className="text-xs font-mono-data text-primary bg-primary/10 px-1.5 py-0.5 rounded">{trip.trip_code}</span>
            )}
            <Badge variant={status.variant} className="gap-1 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{trip.origem || '—'} → {trip.destino || '—'}</span>
            </div>
            {trip.tipo_carga && (
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{trip.tipo_carga}</span>
              </div>
            )}
            {trip.data_saida && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(trip.data_saida), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trip.quality_score != null && (
            <span className={`text-sm font-mono-data font-bold ${
              trip.quality_score >= 80 ? 'text-vs-healthy' : trip.quality_score >= 60 ? 'text-vs-warning' : 'text-destructive'
            }`}>
              {trip.quality_score}%
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/30 p-4 space-y-4 animate-fade-in bg-background/20">
          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso</p>
              <p className="text-sm font-mono-data font-semibold">
                {trip.peso_carga ? `${trip.peso_carga} kg` : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Previsão Chegada</p>
              <p className="text-sm font-mono-data font-semibold">
                {trip.previsao_chegada ? format(new Date(trip.previsao_chegada), "dd/MM HH:mm", { locale: ptBR }) : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Criada em</p>
              <p className="text-sm font-mono-data font-semibold">
                {format(new Date(trip.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Checklist</p>
              <p className="text-sm font-mono-data font-semibold">
                {checklistDone}/5 itens
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist Pré-Viagem</p>
            <div className="flex flex-wrap gap-2">
              {checklistItems.map((item) => (
                <span
                  key={item.label}
                  className={`text-[10px] px-2 py-1 rounded-md border ${
                    item.done
                      ? 'bg-vs-healthy/10 border-vs-healthy/20 text-vs-healthy'
                      : 'bg-muted/30 border-border/30 text-muted-foreground'
                  }`}
                >
                  {item.done ? '✓' : '○'} {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Events timeline */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eventos da Viagem</p>
            {loadingEvents ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum evento registrado</p>
            ) : (
              <div className="space-y-1.5">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">{event.tipo}</span>
                      {event.descricao && (
                        <span className="text-muted-foreground ml-1">— {event.descricao}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground font-mono-data shrink-0">
                      {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TripHistory({ trips }: TripHistoryProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (!showHistory) {
    return (
      <Button
        onClick={() => setShowHistory(true)}
        variant="outline"
        className="gap-2 border-border/50"
      >
        <History className="h-4 w-4" />
        Histórico de Viagens
      </Button>
    );
  }

  return (
    <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            Histórico Completo de Viagens
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono-data">{trips.length} viagens</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2 pr-2">
            {trips.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma viagem registrada</p>
              </div>
            ) : (
              trips.map((trip) => (
                <TripDetailCard key={trip.id} trip={trip} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
