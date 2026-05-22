ALTER TYPE flight_booking_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE flight_booking_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE flight_booking_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE flight_booking_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE flight_booking_status ADD VALUE IF NOT EXISTS 'expired';
