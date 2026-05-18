
-- Table to link multiple beacons to a trip
CREATE TABLE public.trip_beacons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  device_code TEXT NOT NULL,
  device_name TEXT DEFAULT 'Beacon',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_beacons ENABLE ROW LEVEL SECURITY;

-- Users who own the trip (gestor or motorista) can manage its beacons
CREATE POLICY "Trip participants can view trip beacons"
ON public.trip_beacons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_beacons.trip_id
    AND (trips.motorista_id = auth.uid() OR trips.gestor_id = auth.uid())
  )
);

CREATE POLICY "Trip participants can add trip beacons"
ON public.trip_beacons FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_beacons.trip_id
    AND (trips.motorista_id = auth.uid() OR trips.gestor_id = auth.uid())
  )
);

CREATE POLICY "Trip participants can remove trip beacons"
ON public.trip_beacons FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_beacons.trip_id
    AND (trips.motorista_id = auth.uid() OR trips.gestor_id = auth.uid())
  )
);

-- Add sensor config column to trips (JSON with monitored vars and driver-visible vars)
ALTER TABLE public.trips ADD COLUMN sensor_config JSONB DEFAULT '{"monitored":["temperatura","umidade","co2","vibracao","respiracao","indice_cor","estagio","temperatura_carga"],"motorista_visible":["temperatura","umidade","co2","vibracao"]}';
