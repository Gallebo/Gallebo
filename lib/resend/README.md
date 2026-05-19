# Resend (Faza 1 stub)

Email sending is **not active** until a domain is purchased and verified in Resend.

- `client.ts` — returns null until `RESEND_API_KEY` is set
- `send.ts` — logs `[RESEND STUB]` and marks `notification_queue.sent_at`
- `templates/` — HTML stubs for approval, rejection, expiry warnings

Activate in a later phase: set `RESEND_API_KEY`, verify domain, replace stub sends with real API calls.
