# Stripe (Faza 5)

- `STRIPE_SECRET_KEY` — server-only (Checkout, refunds, Connect transfers)
- `STRIPE_WEBHOOK_SECRET` — `POST /api/stripe/webhook`
- Passenger Checkout after pilot accepts; payouts via `process-payouts` edge function
- Never expose `STRIPE_SECRET_KEY` to the client
