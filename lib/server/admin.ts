import { auth } from "@/auth";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email || isPlaceholderOAuthEmail(email)) {
    return false;
  }
  const admins = getAdminEmails();
  if (!admins.length) {
    return false;
  }
  return admins.includes(email.toLowerCase());
}

export async function requireAdminSession() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user?.id || !isAdminEmail(email)) {
    return null;
  }

  return session;
}
