
-- Fix overly permissive INSERT policy on trips
DROP POLICY "Gestores can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (motorista_id = auth.uid() OR gestor_id = auth.uid());
