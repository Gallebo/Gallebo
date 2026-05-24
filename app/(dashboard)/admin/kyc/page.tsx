import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { KycReviewCard } from "@/components/admin/kyc-review-card";
import { getKycQueue } from "@/lib/admin/queries";

export const metadata = { title: "KYC Queue — Admin — Gallebo" };

export default async function AdminKycPage() {
  const queue = await getKycQueue();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Identity verification"
        title="KYC review queue"
        description="Review submissions from Didit. Approve or reject before platform access is granted."
        trailing={
          queue.length > 0 ? (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                background: "color-mix(in srgb, var(--coral) 14%, transparent)",
                color: "var(--coral)",
              }}
            >
              {queue.length} pending
            </span>
          ) : null
        }
      />

      {queue.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            Pending review
          </h2>
          <div className="space-y-4">
            {queue.map((item) => (
              <KycReviewCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      ) : (
        <div
          className="rounded-2xl p-16 text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink-3)",
          }}
        >
          <p className="text-[15px] font-medium">All clear — no pending KYC submissions.</p>
        </div>
      )}
    </div>
  );
}
