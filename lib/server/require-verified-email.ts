import { eq } from "drizzle-orm";
import { userNeedsEmailVerification } from "@/lib/auth/email-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserForProtectedAction(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
      generationCredits: true,
      generationsUsed: true
    }
  });
}

export function getEmailVerificationError(user: {
  email: string;
  emailVerified?: Date | null;
  passwordHash?: string | null;
}) {
  if (!userNeedsEmailVerification(user)) {
    return null;
  }

  return {
    error: "Подтвердите email по ссылке из письма. Без этого вход и генерации недоступны.",
    code: "EMAIL_NOT_VERIFIED"
  };
}
