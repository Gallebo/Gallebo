export interface PlatformConfig {
  key: string;
  label: string;
  value: string;
  description?: string;
  category: string;
}

export function getPlatformConfig(): PlatformConfig[] {
  return [
    // Fees
    {
      key: "platform_fee_pct",
      label: "Platform fee",
      value: "3%",
      description: "Fee deducted from each booking as platform revenue",
      category: "Pricing",
    },
    {
      key: "escrow_window_hours",
      label: "Escrow window",
      value: "48 h",
      description: "Hours held in escrow after flight before pilot payout",
      category: "Pricing",
    },
    {
      key: "refund_window_hours",
      label: "Refund window",
      value: "48 h",
      description: "Passenger refund eligibility window after cancellation",
      category: "Pricing",
    },
    // KYC / Didit
    {
      key: "kyc_provider",
      label: "KYC provider",
      value: "Didit",
      description: "Identity verification service used for pilot onboarding",
      category: "KYC / Identity",
    },
    {
      key: "kyc_required_for_pilot",
      label: "KYC required for pilots",
      value: "Yes",
      description: "Pilots must pass KYC before publishing flights",
      category: "KYC / Identity",
    },
    {
      key: "didit_client_id",
      label: "Didit client ID",
      value: process.env.DIDIT_CLIENT_ID ? `${process.env.DIDIT_CLIENT_ID.slice(0, 6)}…` : "Not set",
      description: "OAuth2 client ID for Didit verification",
      category: "KYC / Identity",
    },
    // Stripe
    {
      key: "stripe_mode",
      label: "Stripe mode",
      value: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "Live" : "Test",
      description: "Whether Stripe is in live or test mode",
      category: "Payments",
    },
    {
      key: "stripe_connect",
      label: "Stripe Connect",
      value: "Enabled",
      description: "Pilot payouts via Stripe Connect express accounts",
      category: "Payments",
    },
    // Booking rules
    {
      key: "max_seats_per_flight",
      label: "Max seats per flight",
      value: "18",
      description: "Hard ceiling on passenger seats for any single flight",
      category: "Booking rules",
    },
    {
      key: "min_lead_time_hours",
      label: "Min booking lead time",
      value: "2 h",
      description: "Minimum hours before departure that a seat can be booked",
      category: "Booking rules",
    },
    {
      key: "currency",
      label: "Currency",
      value: "EUR",
      description: "All amounts on the platform are denominated in Euro",
      category: "Booking rules",
    },
    // Notifications
    {
      key: "transactional_email",
      label: "Transactional email",
      value: "Resend",
      description: "Email provider for booking confirmations and alerts",
      category: "Notifications",
    },
  ];
}
