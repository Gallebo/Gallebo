import Link from "next/link";

import { PilotDocumentRenewalForm } from "@/components/pilot/pilot-document-renewal-form";
import { PilotDocumentRowCard } from "@/components/pilot/pilot-document-row";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotDocuments } from "@/lib/pilot/queries";

export const metadata = { title: "Documents — Gallebo" };

export default async function PilotDocumentsPage() {
  const { user } = await requirePilot();
  const documents = await getPilotDocuments(user.id);

  return (
    <div>
      <PilotPageHeader
        eyebrow="Verification"
        title="Documents"
        description="Your pilot licence, medical, and aircraft paperwork. Reviewed by Didit."
      />

      <div className="mb-8 flex flex-col gap-3">
        {documents.map((doc) => (
          <PilotDocumentRowCard key={doc.id} doc={doc} />
        ))}
      </div>

      <Link
        href="#upload"
        className="mb-10 inline-flex rounded-full border px-5 py-2.5 text-[14px] font-semibold no-underline transition-colors hover:bg-[var(--surface-alt)]"
        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
      >
        Upload new document
      </Link>

      <section id="upload" className="rounded-xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <h2 className="mb-1 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Upload renewals
        </h2>
        <p className="mb-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
          Submit updated licence or medical files for admin review.
        </p>
        <PilotDocumentRenewalForm />
      </section>

      <p className="mt-6 text-[13px]" style={{ color: "var(--ink-3)" }}>
        <Link href="/pilot/stripe" className="underline" style={{ color: "var(--primary-v2)" }}>
          Payout settings
        </Link>
        {" · "}
        <Link href="/pilot/aircraft" className="underline" style={{ color: "var(--primary-v2)" }}>
          Aircraft
        </Link>
        {" · "}
        <Link href="/pilot/edit" className="underline" style={{ color: "var(--primary-v2)" }}>
          Personal info
        </Link>
      </p>
    </div>
  );
}
