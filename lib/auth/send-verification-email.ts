import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { appUrl, sendEmail } from "@/lib/email";

export async function sendVerificationEmail(user: { email: string; name?: string | null }) {
  const verifyToken = crypto.randomUUID();

  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${user.email}`));
  await db.insert(verificationTokens).values({
    identifier: `verify:${user.email}`,
    token: verifyToken,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
  });

  const verifyUrl = appUrl(`/api/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`);

  const emailResult = await sendEmail({
    to: user.email,
    subject: "Подтвердите email в MarketCard AI",
    html: `<p>Здравствуйте, ${user.name || "Продавец"}!</p><p>Подтвердите email, чтобы войти и генерировать карточки:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Ссылка действует 24 часа.</p>`
  });

  return {
    verifyUrl,
    stub: emailResult.stub
  };
}

export async function rollbackRegisteredUser(email: string) {
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${email}`));
  await db.delete(users).where(eq(users.email, email));
}
