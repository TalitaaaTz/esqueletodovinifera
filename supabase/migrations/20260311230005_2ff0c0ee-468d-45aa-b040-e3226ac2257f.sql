
-- Trips table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id uuid NOT NULL,
  gestor_id uuid,
  caminhao text NOT NULL DEFAULT '',
  origem text NOT NULL DEFAULT '',
  destino text NOT NULL DEFAULT '',
  tipo_carga text DEFAULT 'Uvas',
  peso_carga numeric DEFAULT 0,
  data_saida timestamp with time zone,
  previsao_chegada timestamp with time zone,
  status text NOT NULL DEFAULT 'pendente',
  checklist_carga_conferida boolean DEFAULT false,
  checklist_sensores_instalados boolean DEFAULT false,
  checklist_sistema_ligado boolean DEFAULT false,
  checklist_refrigeracao_verificada boolean DEFAULT false,
  checklist_rota_carregada boolean DEFAULT false,
  quality_score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trip events table
CREATE TABLE public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Users can view their trips" ON public.trips
  FOR SELECT TO authenticated
  USING (motorista_id = auth.uid() OR gestor_id = auth.uid());

CREATE POLICY "Gestores can create trips" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their trips" ON public.trips
  FOR UPDATE TO authenticated
  USING (motorista_id = auth.uid() OR gestor_id = auth.uid());

-- Trip events policies
CREATE POLICY "Users can view trip events" ON public.trip_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create trip events" ON public.trip_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on trips
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for trips
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events;
