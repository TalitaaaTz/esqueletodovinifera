
ALTER TABLE public.trips ADD COLUMN trip_code TEXT UNIQUE;

-- Create function to generate unique trip code
CREATE OR REPLACE FUNCTION public.generate_trip_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'VFS-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.trips WHERE trip_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.trip_code := new_code;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate trip code on insert
CREATE TRIGGER set_trip_code
  BEFORE INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_trip_code();
