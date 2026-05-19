import { MapTest } from "@/components/map/map-test";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dev tools",
  robots: { index: false, follow: false },
};

async function getSupabaseStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  hasSession: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { configured: false, connected: false, hasSession: false };
  }

  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        configured: true,
        connected: false,
        hasSession: false,
        error: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      hasSession: Boolean(session),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      configured: true,
      connected: false,
      hasSession: false,
      error: message,
    };
  }
}

export default async function DevPage() {
  const supabaseStatus = await getSupabaseStatus();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Development utilities</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Faza 0 integration checks. Remove or protect this route before
          production.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-border p-6">
        <h2 className="font-semibold">Supabase</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant={supabaseStatus.configured ? "default" : "secondary"}>
            {supabaseStatus.configured ? "Configured" : "Not configured"}
          </Badge>
          {supabaseStatus.configured ? (
            <Badge variant={supabaseStatus.connected ? "default" : "destructive"}>
              {supabaseStatus.connected ? "Connected" : "Connection failed"}
            </Badge>
          ) : null}
          {supabaseStatus.connected ? (
            <Badge variant="outline">
              Session: {supabaseStatus.hasSession ? "active" : "none"}
            </Badge>
          ) : null}
        </div>
        {supabaseStatus.error ? (
          <p className="text-sm text-destructive">{supabaseStatus.error}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">MapLibre + MapTiler</h2>
        <MapTest />
      </section>

      <section className="space-y-2 rounded-lg border border-border p-6 text-sm">
        <h2 className="font-semibold">API health</h2>
        <ul className="list-inside list-disc text-muted-foreground">
          <li>
            <code>GET /api/health</code>
          </li>
          <li>
            <code>GET /api/didit/health</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
