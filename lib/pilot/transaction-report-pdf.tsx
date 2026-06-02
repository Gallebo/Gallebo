import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatPeriodLabel } from "@/lib/pilot/transaction-period";
import type { TransactionReport } from "@/lib/pilot/transactions";
import { formatEur } from "@/lib/pilot/transactions";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#444",
    marginBottom: 16,
  },
  meta: {
    marginBottom: 12,
    lineHeight: 1.4,
  },
  notice: {
    fontSize: 8,
    color: "#555",
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#f5f5f5",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    fontSize: 7,
  },
  colDate: { width: "10%" },
  colRoute: { width: "12%" },
  colPax: { width: "5%", textAlign: "right" },
  colCost: { width: "10%", textAlign: "right" },
  colPilot: { width: "10%", textAlign: "right" },
  colPass: { width: "11%", textAlign: "right" },
  colFee: { width: "10%", textAlign: "right" },
  colNet: { width: "10%", textAlign: "right" },
  colStatus: { width: "22%" },
  totals: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
  },
  totalsLabel: { fontFamily: "Helvetica-Bold" },
  footer: {
    marginTop: 20,
    fontSize: 7,
    color: "#666",
    lineHeight: 1.5,
  },
});

function TableHeader() {
  return (
    <View style={styles.tableHeader}>
      <Text style={styles.colDate}>Date</Text>
      <Text style={styles.colRoute}>Route</Text>
      <Text style={styles.colPax}>Pax</Text>
      <Text style={styles.colCost}>Flight cost</Text>
      <Text style={styles.colPilot}>Pilot share</Text>
      <Text style={styles.colPass}>Passenger share</Text>
      <Text style={styles.colFee}>Platform fee</Text>
      <Text style={styles.colNet}>Net received</Text>
      <Text style={styles.colStatus}>Payout status</Text>
    </View>
  );
}

export function TransactionReportPdfDocument({
  report,
}: {
  report: TransactionReport;
}) {
  const generated = new Date(report.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodLabel = formatPeriodLabel(report.periodFrom, report.periodTo);

  return (
    <Document title="Transaction report">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Cost-sharing transaction report</Text>
        <Text style={styles.subtitle}>Flight Sharing Platform · Gallebo</Text>

        <View style={styles.meta}>
          <Text>Pilot: {report.pilotFullName}</Text>
          <Text>Period: {periodLabel}</Text>
          <Text>Generated: {generated}</Text>
        </View>

        <Text style={styles.notice}>
          This report documents cost-sharing reimbursements under EASA Reg. 965/2012
          (Part-NCO). Amounts received from passengers represent a share of direct flight
          costs, not commercial income. Net received equals pilot payout per booking
          (base seat price minus 4% platform deduction). Card processing fees are borne by
          the platform and are not deducted from pilot payouts.
        </Text>

        {report.flights.length === 0 ? (
          <Text>No paid bookings in this period.</Text>
        ) : (
          <>
            <TableHeader />
            {report.flights.map((row) => (
              <View key={row.flightId} style={styles.tableRow}>
                <Text style={styles.colDate}>{row.dateLabel}</Text>
                <Text style={styles.colRoute}>{row.route}</Text>
                <Text style={styles.colPax}>{row.passengerCount}</Text>
                <Text style={styles.colCost}>{formatEur(row.totalCostEur)}</Text>
                <Text style={styles.colPilot}>{formatEur(row.pilotOwnShareEur)}</Text>
                <Text style={styles.colPass}>{formatEur(row.passengerShareEur)}</Text>
                <Text style={styles.colFee}>{formatEur(row.platformFeeEur)}</Text>
                <Text style={styles.colNet}>{formatEur(row.netReceivedEur)}</Text>
                <Text style={styles.colStatus}>
                  {row.payoutStatusLabel}
                  {row.paidOutAt
                    ? ` (${new Date(row.paidOutAt).toLocaleDateString("en-GB")})`
                    : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total flight costs</Text>
            <Text>{formatEur(report.totals.totalFlightCostEur)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total passenger share (gross)</Text>
            <Text>{formatEur(report.totals.totalPassengerShareEur)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total platform fee</Text>
            <Text>{formatEur(report.totals.totalPlatformFeeEur)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total net received (pilot payout)</Text>
            <Text>{formatEur(report.totals.totalNetReceivedEur)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total pilot own share (cost borne)</Text>
            <Text>{formatEur(report.totals.totalPilotOwnShareEur)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            • Amounts from passengers are reimbursements of direct flight costs, not income.
          </Text>
          <Text>• Cost-sharing is conducted per EASA Reg. 965/2012; no profit element.</Text>
          <Text>
            • Payouts are sent via Stripe Connect Express to the pilot&apos;s registered IBAN.
          </Text>
          <Text>
            • For tax treatment, consult a qualified adviser in your country of residence.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
