-- Criar política para permitir INSERT público na tabela de sensores
CREATE POLICY "Allow public insert for sensor data" 
ON public.viniferasense_data 
FOR INSERT 
TO public 
WITH CHECK (true);