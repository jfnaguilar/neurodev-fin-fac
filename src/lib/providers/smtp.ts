// SMTP email via nodemailer (npm install nodemailer @types/nodemailer)

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;   // true for 465, false for 587/25
  user: string;      // SMTP login (usually the from email)
  password: string;  // stored encrypted in apiKeyEnc
  fromEmail: string;
  fromName: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendViaSmtp(settings: SmtpSettings, params: SendEmailParams): Promise<void> {
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error("Nodemailer não instalado. Execute: npm install nodemailer @types/nodemailer");
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.password },
  });

  await transporter.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });
}

export async function testSmtpConnection(settings: SmtpSettings): Promise<boolean> {
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.user, pass: settings.password },
    });
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

export function parseSmtpSettings(settings: Record<string, string>, password: string): SmtpSettings {
  return {
    host: settings.smtpHost ?? "",
    port: parseInt(settings.smtpPort ?? "587", 10),
    secure: settings.smtpSecure === "true",
    user: settings.smtpUser ?? "",
    password,
    fromEmail: settings.fromEmail ?? "",
    fromName: settings.fromName ?? "",
  };
}
