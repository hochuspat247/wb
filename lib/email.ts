type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MarketCard AI <hello@marketcard.ai>";

  if (!apiKey) {
    console.info("[MarketCard AI] Email stub:", { to, subject });
    return { ok: true, stub: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html })
  });

  if (!response.ok) {
    throw new Error("Не удалось отправить письмо.");
  }

  return { ok: true, stub: false as const };
}

export function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const normalized = base.startsWith("http") ? base : `https://${base}`;
  return `${normalized.replace(/\/$/, "")}${path}`;
}
