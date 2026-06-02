import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { requirePilot } from "@/lib/auth/rbac";
import { TransactionReportPdfDocument } from "@/lib/pilot/transaction-report-pdf";
import { resolveTransactionPeriod } from "@/lib/pilot/transaction-period";
import { getPilotTransactionReport } from "@/lib/pilot/transactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { user } = await requirePilot();
    const url = new URL(request.url);
    const period = resolveTransactionPeriod({
      year: url.searchParams.get("year"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });

    const report = await getPilotTransactionReport(user.id, period);
    const buffer = await renderToBuffer(
      <TransactionReportPdfDocument report={report} />,
    );

    const filename = `transactions-${period.from}-to-${period.to}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[transactions/report]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate report",
      },
      { status: 500 },
    );
  }
}
