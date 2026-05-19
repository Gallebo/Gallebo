const RESEND_API_URL = "https://api.resend.com/emails";

// Test mode: send to onboarding@resend.dev until domain is verified
// TODO: replace with verified domain once purchased
const FROM_ADDRESS = "Gallebo <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    console.log("[RESEND] RESEND_API_KEY not set — logging only");
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  To: ${opts.to}`);
    return { ok: true };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text };
  }

  return { ok: true };
}
