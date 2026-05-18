-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('motorista', 'gestor');

-- Create users_profile table
CREATE TABLE public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo public.user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- RLS policies for users_profile
CREATE POLICY "Users can view their own profile"
ON public.users_profile
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.users_profile
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users_profile
FOR UPDATE
USING (auth.uid() = id);

-- Create viniferasense_data table for sensor readings
CREATE TABLE public.viniferasense_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temperatura DECIMAL(5,2) NOT NULL,
    umidade DECIMAL(5,2) NOT NULL,
    co2 INTEGER NOT NULL,
    respiracao DECIMAL(6,2) NOT NULL,
    indice_cor DECIMAL(3,2) NOT NULL,
    estagio TEXT NOT NULL,
    vibracao TEXT NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    rota TEXT,
    veiculo TEXT,
    carga TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for viniferasense_data
ALTER TABLE public.viniferasense_data ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sensor data
CREATE POLICY "Authenticated users can read sensor data"
ON public.viniferasense_data
FOR SELECT
TO authenticated
USING (true);

-- Enable realtime for sensor data
ALTER PUBLICATION supabase_realtime ADD TABLE public.viniferasense_data;

-- Insert sample data for testing
INSERT INTO public.viniferasense_data (
    temperatura, umidade, co2, respiracao, indice_cor, estagio, vibracao, 
    latitude, longitude, rota, veiculo, carga
) VALUES (
    4.2, 87, 425, 27, 0.75, 'Verde-Maduro', 'Moderada',
    -8.0476, -34.8770, 'Petrolina → Recife', 'Caminhão Frigorífico #23', 'Uvas de Mesa - 2.500kg'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for users_profile
CREATE TRIGGER update_users_profile_updated_at
BEFORE UPDATE ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();