# Otkazivanje bookinga

## Putnik otkazuje potvrđeni booking (`confirmed`)

Ponašanje ovisi o vremenu do polaska (vidi `passengerRefundEligible` u `lib/bookings/pricing.ts`):

| Situacija | Povrat putniku | `payout_status` pilota |
|-----------|----------------|------------------------|
| Otkaz **≥ 48 h** prije leta | Puni refund | `not_applicable` (nema isplate) |
| Otkaz **< 48 h** prije leta | Bez refunda | `not_applicable` |

### Kasno otkazivanje (< 48 h) — TBD

Kad putnik otkaže unutar 48 sati prije polaska:

- Uplata se ne vraća putniku (`refundFull = false`).
- Pilot **ne** dobiva automatsku isplatu (`payout_status = 'not_applicable'`).
- Novac ostaje na platformi do definiranja poslovnog pravila (npr. djelomična kompenzacija pilotu, kredit, ili zadržavanje).

**Implementacija pilotove kompenzacije ili dijela uplate pilotu nije u scopeu trenutnog koda** — samo dokumentirano ovdje za budući product/legal odluku.

## Pilot odbija ili otkazuje

Obrnuti flowovi (odbijanje zahtjeva, otkaz leta) imaju zasebnu logiku u `lib/bookings/actions.ts` i specifikaciji platforme.
