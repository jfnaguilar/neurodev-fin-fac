// Resend — transactional email via REST API (no npm required)
// Docs: https://resend.com/docs/api-reference/emails/send-email

export interface SendEmailParams {
  from: string;   // "Name <email@domain.com>"
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendViaResend(apiKey: string, params: SendEmailParams): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${err.message ?? JSON.stringify(err)}`);
  }
}

export async function testResendConnection(apiKey: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return res.ok;
}
