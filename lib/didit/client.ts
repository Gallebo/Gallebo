import { assertCanStartDiditSession } from "@/lib/didit/guards";
import { getDiditConfig } from "@/lib/didit/config";
import { getAppUrl } from "@/lib/env";

export type DiditSession = {
  sessionId: string;
  redirectUrl: string;
};

export async function createVerificationSession(
  userId: string
): Promise<DiditSession> {
  await assertCanStartDiditSession(userId);

  const { DIDIT_API_KEY: apiKey, DIDIT_WORKFLOW_ID: workflowId } =
    getDiditConfig();

  const response = await fetch("https://verification.didit.me/v2/session/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: userId,
      callback: `${getAppUrl()}/dashboard`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Didit API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    session_id?: string;
    id?: string;
    url?: string;
    verification_url?: string;
  };

  const sessionId = data.session_id ?? data.id;
  const redirectUrl = data.url ?? data.verification_url;

  if (!sessionId || !redirectUrl) {
    throw new Error("Invalid Didit session response");
  }

  return { sessionId, redirectUrl };
}
