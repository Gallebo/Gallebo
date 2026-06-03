ALTER TABLE public.airfields
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS elevation_ft integer;

COMMENT ON COLUMN public.airfields.city IS 'Municipality / locality from OurAirports seed';
COMMENT ON COLUMN public.airfields.elevation_ft IS 'Field elevation in feet (OurAirports)';
