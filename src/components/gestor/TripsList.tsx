import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Route, Clock, MapPin, Truck, Package, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { Trip, TripEvent } from '@/hooks/useTrips';

interface TripsListProps {
  trips: Trip[];
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }> = {
  pendente: { label: 'Pendente', variant: 'secondary', dotColor: 'bg-muted-foreground' },
  em_andamento: { label: 'Em Andamento', variant: 'default', dotColor: 'bg-primary animate-pulse' },
  concluida: { label: 'Concluída', variant: 'outline', dotColor: 'bg-[hsl(var(--vs-healthy))]' },
  cancelada: { label: 'Cancelada', variant: 'destructive', dotColor: 'bg-destructive' },
};

function TripDetailDialog({ trip, open, onOpenChange }: { trip: Trip; open: boolean; onOpenChange: (v: boolean) => void }) {
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
    if (open) fetchEvents();
  }, [open, fetchEvents]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {trip.caminhao || 'Viagem'}
            {trip.trip_code && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{trip.trip_code}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-5">
            {/* Status & Route */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.variant} className="gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                {status.label}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {trip.origem || '—'} → {trip.destino || '—'}
              </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo de Carga</p>
                <p className="text-sm font-semibold">{trip.tipo_carga || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso</p>
                <p className="text-sm font-mono font-semibold">{trip.peso_carga ? `${trip.peso_carga} kg` : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saída</p>
                <p className="text-sm font-mono font-semibold">
                  {trip.data_saida ? format(new Date(trip.data_saida), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Previsão Chegada</p>
                <p className="text-sm font-mono font-semibold">
                  {trip.previsao_chegada ? format(new Date(trip.previsao_chegada), "dd/MM HH:mm", { locale: ptBR }) : '—'}
                </p>
              </div>
              {trip.quality_score != null && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Quality Score</p>
                  <p className={`text-sm font-mono font-bold ${
                    trip.quality_score >= 80 ? 'text-[hsl(var(--vs-healthy))]' : trip.quality_score >= 60 ? 'text-[hsl(var(--vs-warning))]' : 'text-destructive'
                  }`}>
                    {trip.quality_score}%
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Criada em</p>
                <p className="text-sm font-mono font-semibold">
                  {format(new Date(trip.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist ({checklistDone}/5)</p>
              <div className="flex flex-wrap gap-2">
                {checklistItems.map((item) => (
                  <span
                    key={item.label}
                    className={`text-[10px] px-2 py-1 rounded-md border ${
                      item.done
                        ? 'bg-[hsl(var(--vs-healthy))]/10 border-[hsl(var(--vs-healthy))]/20 text-[hsl(var(--vs-healthy))]'
                        : 'bg-muted/30 border-border/30 text-muted-foreground'
                    }`}
                  >
                    {item.done ? '✓' : '○'} {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eventos</p>
              {loadingEvents ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />)}
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
                        {event.descricao && <span className="text-muted-foreground ml-1">— {event.descricao}</span>}
                      </div>
                      <span className="text-muted-foreground font-mono shrink-0">
                        {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function TripsList({ trips }: TripsListProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  if (trips.length === 0) {
    return (
      <Card className="gradient-vs-card-dark border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma viagem registrada</p>
          <p className="text-sm mt-1">Crie uma viagem para começar o monitoramento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="gradient-vs-card-dark border-border/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              Viagens Recentes
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono-data">{trips.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {trips.slice(0, 10).map((trip) => {
            const status = statusMap[trip.status] || statusMap.pendente;
            return (
              <button
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className="w-full text-left p-4 rounded-xl bg-background/40 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{trip.caminhao || 'N/A'}</span>
                    {trip.tipo_carga && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50">{trip.tipo_carga}</span>
                    )}
                  </div>
                  <Badge variant={status.variant} className="gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{trip.origem || '—'} → {trip.destino || '—'}</span>
                  </div>
                  {trip.data_saida && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(trip.data_saida), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selectedTrip && (
        <TripDetailDialog
          trip={selectedTrip}
          open={!!selectedTrip}
          onOpenChange={(v) => !v && setSelectedTrip(null)}
        />
      )}
    </>
  );
}
