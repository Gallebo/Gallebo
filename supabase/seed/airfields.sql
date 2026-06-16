-- Seed airfields from OurAirports filtered CSV (HR + SI)
-- Generated: 2026-06-16T18:54:19.713Z
-- Rows: 37

INSERT INTO public.airfields (
  icao_code,
  name,
  city,
  country,
  latitude,
  longitude,
  elevation_ft
)
VALUES
  ('LDLO', 'Lošinj Airport', 'Mali Lošinj', 'HR', 44.566985, 14.393883, 151),
  ('LDOB', 'Vukovar Borovo Recreational Airfield', 'Vukovar', 'HR', 45.386398, 18.962799, 289),
  ('LDOR', 'Slavonski Jelas Airfield', 'Slavonski', 'HR', 45.156101, 17.9881, 276),
  ('LDOV', 'Vinkovci Sopot Airfield', 'Vinkovci', 'HR', 45.251099, 18.759199, 266),
  ('LDPM', 'Medulin Campanoz Airfield', 'Medulin', 'HR', 44.843878, 13.904376, 171),
  ('LDPN', 'Unije Airfield', 'Unije Island', 'HR', 44.6283, 14.2411, 39),
  ('LDPV', 'Vrsar Crljenka Airfield', 'Vrsar', 'HR', 45.141701, 13.6306, 121),
  ('LDRG', 'Grobničko Polje Airfield', 'Soboli', 'HR', 45.379501, 14.5038, 951),
  ('LDRO', 'Otočac Airfield', 'Otočac', 'HR', 44.845517, 15.288607, 1539),
  ('LDSH', 'Hvar Airfield', 'Hvar Island', 'HR', 43.181702, 16.633301, 92),
  ('LDSS', 'Sinj Piket Airfield', 'Sinj', 'HR', 43.700298, 16.6714, 981),
  ('LDVA', 'Varaždin Airfield', 'Varaždin', 'HR', 46.294668, 16.383222, 548),
  ('LDVC', 'Čakovec Pribislavec Airfield', 'Čakovec', 'HR', 46.391899, 16.500299, 512),
  ('LDVD', 'Daruvar Blagorod Airfield', 'Daruvar', 'HR', 45.559399, 17.0331, 410),
  ('LDVK', 'Koprivnica Danic Airfield', 'Koprivnica', 'HR', 46.2131, 16.8372, 440),
  ('LDVR', 'Daruvar Airfield', 'Daruvar', 'HR', 45.585073, 17.211387, 492),
  ('LDZB', 'Buševec Velika Glider Field', 'Busevec', 'HR', 45.647499, 16.124399, 341),
  ('LDZE', 'Zvekovac Airfield', 'Zvekovac', 'HR', 45.823056, 16.5, 374),
  ('LDZI', 'Ivanić-Grad Airstrip', 'Ivanić-Grad', 'HR', 45.719874, 16.343272, 374),
  ('LDZJ', 'Bjelovar Brezovac Airfield', 'Brezovac', 'HR', 45.860802, 16.8358, 430),
  ('LDZK', 'Zabok-Gubaševo Airfield', 'Gubaševo', 'HR', 46.012746, 15.860159, NULL),
  ('LDZL', 'Lučko Airfield', 'Zagreb', 'HR', 45.766725, 15.849709, 400),
  ('LDZP', 'Zvonimir Rain Glider Airfield', 'Korenica', 'HR', 44.699634, 15.781688, 1979),
  ('LDZS', 'Sisak Airfield', 'Prelošćica', 'HR', 45.465556, 16.486389, 305),
  ('LJAJ', 'Ajdovščina Airfield', 'Ajdovščina', 'SI', 45.889198, 13.8869, 381),
  ('LJBL', 'Lesce Airfield', 'Lesce', 'SI', 46.357201, 14.1739, 1654),
  ('LJBO', 'Bovec Airfield', 'Bovec', 'SI', 46.329017, 13.550231, 1417),
  ('LJCL', 'Celje Airfield', 'Celje', 'SI', 46.245602, 15.2231, 801),
  ('LJDI', 'Divača Airfield', 'Divača', 'SI', 45.682778, 14.003234, 1420),
  ('LJMS', 'Murska Sobota Airfield', 'Murska Sobota', 'SI', 46.629398, 16.174999, 600),
  ('LJNM', 'Novo Mesto Airfield', 'Novo Mesto', 'SI', 45.801743, 15.104544, 572),
  ('LJPO', 'Postojna Airfield', 'Postojna', 'SI', 45.752201, 14.1947, NULL),
  ('LJPT', 'Ptuj Airfield', 'Moškanjci', 'SI', 46.42709, 15.98609, 689),
  ('LJPZ', 'Portorož Airport', 'Sečovlje', 'SI', 45.47201, 13.615951, 7),
  ('LJSG', 'Slovenj Gradec Airfield', 'Šmartno pri Slovenj Gradcu', 'SI', 46.472, 15.117, 1645),
  ('LJSK', 'Slovenske Konjice Airfield', 'Loče', 'SI', 46.31033, 15.492024, NULL),
  ('LJVE', 'Šoštanj Airfield', 'Topolšica', 'SI', 46.397499, 15.0453, 1283)
ON CONFLICT (icao_code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  elevation_ft = EXCLUDED.elevation_ft,
  updated_at = now();
