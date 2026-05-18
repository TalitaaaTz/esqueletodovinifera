-- Add 'autonomo' to user_type enum
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'autonomo';

-- Create user_devices table to link users to beacon devices
CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_code text NOT NULL,
  device_name text DEFAULT 'Beacon',
  linked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_code)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices" ON public.user_devices
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can link devices" ON public.user_devices
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlink devices" ON public.user_devices
  FOR DELETE TO authenticated USING (user_id = auth.uid());