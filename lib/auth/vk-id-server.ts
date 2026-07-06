import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, users } from "@/lib/db/schema";

type VkUserInfoResponse = {
  user?: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    email?: string;
  };
  error?: string;
};

function getVkAppId() {
  return process.env.AUTH_VK_ID || process.env.NEXT_PUBLIC_VK_APP_ID || "";
}

export async function authenticateVkAccessToken(accessToken: string) {
  const clientId = getVkAppId();

  if (!clientId || !accessToken) {
    return null;
  }

  const response = await fetch("https://id.vk.ru/oauth2/user_info", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      access_token: accessToken
    })
  });

  const data = (await response.json()) as VkUserInfoResponse;

  if (!data.user?.user_id) {
    return null;
  }

  const vkUserId = String(data.user.user_id);
  const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ") || "Пользователь VK";
  const email = data.user.email?.trim() || `vk_${vkUserId}@oauth.marketcard.local`;
  const image = data.user.avatar;

  const linkedAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, "vk"), eq(accounts.providerAccountId, vkUserId))
  });

  if (linkedAccount) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, linkedAccount.userId)
    });

    if (existingUser) {
      return {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name || name,
        image: existingUser.image || image
      };
    }
  }

  const emailUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (emailUser) {
    await db
      .insert(accounts)
      .values({
        userId: emailUser.id,
        type: "oauth",
        provider: "vk",
        providerAccountId: vkUserId,
        access_token: accessToken
      })
      .onConflictDoNothing();

    return {
      id: emailUser.id,
      email: emailUser.email,
      name: emailUser.name || name,
      image: emailUser.image || image
    };
  }

  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    image,
    generationCredits: 1,
    generationsUsed: 0,
    createdAt: new Date()
  });

  await db.insert(accounts).values({
    userId,
    type: "oauth",
    provider: "vk",
    providerAccountId: vkUserId,
    access_token: accessToken
  });

  return {
    id: userId,
    email,
    name,
    image
  };
}
