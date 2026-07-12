import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { WB_INTEGRATION_MIN_PACKAGE } from "@/lib/pricing";
import { hasUnlimitedGenerations } from "@/lib/server/unlimitedGenerations";

export async function hasWildberriesAccess(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      hasPurchasedGenerationCredits: true,
      email: true,
      name: true
    }
  });

  if (!user) {
    return false;
  }

  if (hasUnlimitedGenerations(user)) {
    return true;
  }

  return Boolean(user.hasPurchasedGenerationCredits);
}

export function getWildberriesAccessError() {
  return `Публикация на Wildberries доступна с тарифа «Рост» — от ${WB_INTEGRATION_MIN_PACKAGE} генераций.`;
}
