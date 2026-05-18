-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read sensor data" ON public.viniferasense_data;

-- Drop the overly permissive public INSERT policy
DROP POLICY IF EXISTS "Allow public insert for sensor data" ON public.viniferasense_data;

-- Add authenticated-only INSERT policy
CREATE POLICY "Authenticated users can insert sensor data"
ON public.viniferasense_data
FOR INSERT
TO authenticated
WITH CHECK (true);