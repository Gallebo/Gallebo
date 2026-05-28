<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase Edge Functions

Cron i transakcijski email idu preko **Supabase Edge Functions** (`supabase/functions/`), ne preko Next.js API ruta. Kad radiš na tim datotekama, Cursor učitava pravilo iz `.cursor/rules/supabase-edge-functions.mdc`.

## Reviews (RLS i public viewovi)

Blind review koristi base tablice `pilot_reviews` / `passenger_reviews` (participant RLS, uklj. vlastiti red prije reveal-a). Agregacije i cross-user čitanje idu preko `pilot_reviews_public` / `passenger_reviews_public` s `security_invoker = FALSE` i fiksnim `WHERE is_visible = true`. Prije mijenjanja view definicije ili prelaska na `security_invoker = TRUE`, pročitaj [docs/reviews-security.md](docs/reviews-security.md).
