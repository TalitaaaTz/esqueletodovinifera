-- Fix security warning: remove overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow ESP32 to insert sensor data" ON public.viniferasense_data;

-- Keep existing SELECT policies as-is (public read is OK for this dataset)
-- Note: service_role bypasses RLS, so backend functions can still insert safely.