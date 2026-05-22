ALTER TABLE public.aircraft
  ADD COLUMN IF NOT EXISTS max_passenger_weight_kg numeric(6, 1);

COMMENT ON COLUMN public.aircraft.max_passenger_weight_kg IS 'Max total passenger weight (kg) for weight check warnings';
