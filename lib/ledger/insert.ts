import { createAdminClient } from "@/lib/supabase/admin";

export type LedgerEntryType =
  | "booking_payment"
  | "platform_fee"
  | "pilot_payout"
  | "refund"
  | "payout_failed";

export type LedgerInsertEntry = {
  booking_id: string;
  type: LedgerEntryType;
  amount_eur: number;
  idempotency_key: string;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_refund_id?: string | null;
  stripe_transfer_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function insertLedger(
  admin: ReturnType<typeof createAdminClient>,
  entry: LedgerInsertEntry,
): Promise<void> {
  const { error } = await admin.from("ledger").insert({
    booking_id: entry.booking_id,
    type: entry.type,
    amount_eur: entry.amount_eur,
    idempotency_key: entry.idempotency_key,
    stripe_payment_intent_id: entry.stripe_payment_intent_id ?? null,
    stripe_checkout_session_id: entry.stripe_checkout_session_id ?? null,
    stripe_refund_id: entry.stripe_refund_id ?? null,
    stripe_transfer_id: entry.stripe_transfer_id ?? null,
    metadata: (entry.metadata ?? {}) as Record<string, never>,
  });

  if (error && error.code !== "23505") {
    throw new Error(`Ledger insert failed: ${error.message}`);
  }
}
