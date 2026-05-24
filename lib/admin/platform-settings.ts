export interface AdminPlatformSetting {
  key: string;
  label: string;
  description: string;
  value: string;
}

/** Read-only settings shown on the admin Settings page (matches product spec UI). */
export function getAdminPlatformSettings(): AdminPlatformSetting[] {
  return [
    {
      key: "platform_fee_rate",
      label: "Platform fee rate",
      description: "Percentage of GMV per transaction",
      value: "3%",
    },
    {
      key: "kyc_provider",
      label: "KYC provider",
      description: "Identity verification API",
      value: "Didit v2.1",
    },
    {
      key: "payment_processor",
      label: "Payment processor",
      description: "Escrow and disbursement",
      value: "Stripe Connect",
    },
    {
      key: "cost_sharing_formula",
      label: "Cost-sharing formula",
      description: "Locked at flight posting time",
      value: "EU 965/2012 Part-NCO",
    },
    {
      key: "booking_window",
      label: "Booking window",
      description: "Time for pilot to accept or decline requests",
      value: "48 hours",
    },
    {
      key: "review_window",
      label: "Review window",
      description: "Blind two-way review submission window",
      value: "24 h post-flight",
    },
    {
      key: "max_passengers",
      label: "Max passengers/flight",
      description: "EASA NCO light-aircraft passenger cap",
      value: "6",
    },
  ];
}
