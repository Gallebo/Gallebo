ALTER TABLE public.flights
  ADD CONSTRAINT flights_panoramic_same_airfield CHECK (
    flight_type <> 'panoramic'
    OR departure_airfield_id = arrival_airfield_id
  );
