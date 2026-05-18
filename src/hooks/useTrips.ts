import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Trip {
  id: string;
  motorista_id: string;
  gestor_id: string | null;
  caminhao: string;
  origem: string;
  destino: string;
  tipo_carga: string | null;
  peso_carga: number | null;
  data_saida: string | null;
  previsao_chegada: string | null;
  status: string;
  checklist_carga_conferida: boolean;
  checklist_sensores_instalados: boolean;
  checklist_sistema_ligado: boolean;
  checklist_refrigeracao_verificada: boolean;
  checklist_rota_carregada: boolean;
  quality_score: number | null;
  trip_code: string | null;
  sensor_config: { monitored: string[]; motorista_visible: string[] } | null;
  created_at: string;
  updated_at: string;
}

export interface TripEvent {
  id: string;
  trip_id: string;
  user_id: string;
  tipo: string;
  descricao: string | null;
  created_at: string;
}

export function useTrips() {
  const { user } = useAuthContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTrips((data as Trip[]) || []);
    } catch (e: any) {
      console.error('Error fetching trips:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchEvents = useCallback(async (tripId?: string) => {
    if (!user) return;
    try {
      let query = supabase
        .from('trip_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (tripId) query = query.eq('trip_id', tripId);
      const { data, error } = await query;
      if (error) throw error;
      setEvents((data as TripEvent[]) || []);
    } catch (e: any) {
      console.error('Error fetching events:', e);
    }
  }, [user]);

  const createTrip = useCallback(async (trip: Partial<Trip>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({ ...trip, motorista_id: trip.motorista_id || user.id } as any)
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Viagem criada', description: 'A viagem foi criada com sucesso.' });
      await fetchTrips();
      return data as Trip;
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      return null;
    }
  }, [user, fetchTrips]);

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      await fetchTrips();
      return true;
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      return false;
    }
  }, [fetchTrips]);

  const addEvent = useCallback(async (tripId: string, tipo: string, descricao?: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('trip_events')
        .insert({ trip_id: tripId, user_id: user.id, tipo, descricao } as any)
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Evento registrado', description: `${tipo} registrado com sucesso.` });
      await fetchEvents(tripId);
      return data as TripEvent;
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      return null;
    }
  }, [user, fetchEvents]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const activeTrip = trips.find(t => t.status === 'em_andamento');

  return {
    trips,
    events,
    loading,
    activeTrip,
    fetchTrips,
    fetchEvents,
    createTrip,
    updateTrip,
    addEvent,
  };
}
