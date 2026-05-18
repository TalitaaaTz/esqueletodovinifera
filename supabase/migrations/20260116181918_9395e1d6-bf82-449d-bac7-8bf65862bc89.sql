-- Permitir INSERT na tabela viniferasense_data para a service_role key (usada pelo ESP32)
-- Ou para qualquer requisição (se ESP32 usa anon key)
CREATE POLICY "Allow ESP32 to insert sensor data"
ON public.viniferasense_data
FOR INSERT
WITH CHECK (true);

-- Também permitir leitura pública para o dashboard funcionar sem login durante testes
CREATE POLICY "Anyone can read sensor data"
ON public.viniferasense_data
FOR SELECT
USING (true);