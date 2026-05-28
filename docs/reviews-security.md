# Reviews — security model (Phase 7)

## Public views (`*_reviews_public`)

`pilot_reviews_public` and `passenger_reviews_public` are Postgres views with `security_invoker = FALSE`. They run with the view owner’s privileges and **do not apply** RLS on the underlying review tables.

This matches the pattern introduced in migration `068_reviews_pilot_schema.sql` for pilot reviews.

### Why not `security_invoker = TRUE`?

Base-table RLS on `passenger_reviews` is **participant-scoped**:

- The author can read their own row before reveal (`pilot_user_id` or `reviewer_user_id`).
- The subject can read the other party’s review only after `is_visible = true`.

A pilot evaluating a **pending booking request** must read **other pilots’ visible reviews** about that passenger. That user is neither `pilot_user_id` nor `passenger_user_id` on those rows, so RLS would deny access if the view used the invoker’s rights.

Batch reputation in `getPilotBookingRequests` (`lib/pilot/queries.ts`) therefore queries `passenger_reviews_public`, not `passenger_reviews`.

### Defense in depth

The only filter exposing data through these views is the immutable predicate:

```sql
WHERE is_visible = true
```

**Do not** change or remove this clause without a security review. Hidden (blind-period) reviews must never appear in public views.

Callers that need cross-user reads must use the public views (or a future `SECURITY DEFINER` RPC with explicit role checks), not direct `SELECT` on the base tables.

## `passenger_reviews_public` columns

| Column | Purpose |
|--------|---------|
| `passenger_user_id`, `rating` | Batch avg/count on pilot booking requests |
| `pilot_user_id` | Map pilot names on passenger profile (“reviews received”) |
| Category + `comment` | Profile display |

`booking_id` was intentionally omitted from the view (migration `074`); it is not needed for current UI.

## Blind-period reads (base table)

Migration `073` allows participants to `SELECT` their **own** submission while `is_visible = false`. App helpers:

- `getOwnPilotReviewSubmission` — passenger’s review of pilot
- `getOwnPassengerReviewSubmission` — pilot’s review of passenger

These use the user Supabase client and the base tables, not the public views.

## Future hardening (not implemented)

- RLS policy: verified pilots may `SELECT` rows where `is_visible = true`, then switch views to `security_invoker = TRUE`
- `SECURITY DEFINER` RPC `get_passenger_reputation_batch(passenger_ids uuid[])` with explicit pilot role check
