import { requireAdmin } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Ledger — Admin — Gallebo" };

export default async function AdminLedgerPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("ledger")
    .select("id, type, amount_eur, booking_id, idempotency_key, created_at, stripe_payment_intent_id, stripe_refund_id, stripe_transfer_id")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Financial ledger</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of payments, fees, payouts, and refunds.
        </p>
      </div>

      {entries && entries.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3">Time</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Booking</th>
                <th className="p-3">Stripe refs</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">{e.type}</td>
                  <td className="p-3">€{Number(e.amount_eur).toFixed(2)}</td>
                  <td className="p-3 font-mono text-xs">
                    {e.booking_id?.slice(0, 8) ?? "—"}…
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {e.stripe_payment_intent_id?.slice(0, 12) ??
                      e.stripe_transfer_id?.slice(0, 12) ??
                      e.stripe_refund_id?.slice(0, 12) ??
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
      )}
    </div>
  );
}
