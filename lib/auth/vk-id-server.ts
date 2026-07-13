import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, users } from "@/lib/db/schema";
import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";

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

function normalizeOAuthEmail(email?: string | null) {
  const trimmed = email?.trim();
  if (!trimmed || !trimmed.includes("@")) {
    return null;
  }

  return trimmed.toLowerCase();
}

function buildPlaceholderVkEmail(vkUserId: string) {
  return `vk_${vkUserId}@oauth.marketcard.local`;
}

async function updateLinkedVkAccountAccessToken(userId: string, vkUserId: string, accessToken: string) {
  await db
    .update(accounts)
    .set({ access_token: accessToken })
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "vk"), eq(accounts.providerAccountId, vkUserId)));
}

async function syncLinkedVkUser(
  userId: string,
  vkUserId: string,
  profile: {
    name: string;
    image?: string;
    realEmail: string | null;
    accessToken: string;
  }
) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!existingUser) {
    return null;
  }

  let nextEmail = existingUser.email;
  const updates: {
    email?: string;
    emailVerified?: Date;
    name?: string | null;
    image?: string | null;
  } = {
    name: existingUser.name || profile.name,
    image: existingUser.image || profile.image || null
  };

  if (profile.realEmail && isPlaceholderOAuthEmail(existingUser.email)) {
    const conflictingUser = await db.query.users.findFirst({
      where: eq(users.email, profile.realEmail)
    });

    if (!conflictingUser || conflictingUser.id === existingUser.id) {
      nextEmail = profile.realEmail;
      updates.email = profile.realEmail;
      updates.emailVerified = new Date();
    }
  }

  await db.update(users).set(updates).where(eq(users.id, existingUser.id));
  await updateLinkedVkAccountAccessToken(existingUser.id, vkUserId, profile.accessToken);

  return {
    id: existingUser.id,
    email: nextEmail,
    name: updates.name || existingUser.name,
    image: updates.image || existingUser.image
  };
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

  if (!response.ok || !data.user?.user_id) {
    console.error("[MarketCard AI] VK user_info failed", response.status, data.error || data);
    return null;
  }

  const vkUserId = String(data.user.user_id);
  const name = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ") || "Пользователь VK";
  const realEmail = normalizeOAuthEmail(data.user.email);
  const email = realEmail || buildPlaceholderVkEmail(vkUserId);
  const image = data.user.avatar;
  const emailVerified = new Date();

  const linkedAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.provider, "vk"), eq(accounts.providerAccountId, vkUserId))
  });

  if (linkedAccount) {
    return syncLinkedVkUser(linkedAccount.userId, vkUserId, {
      name,
      image,
      realEmail,
      accessToken
    });
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

    if (realEmail && isPlaceholderOAuthEmail(emailUser.email)) {
      await db
        .update(users)
        .set({
          email: realEmail,
          emailVerified,
          name: emailUser.name || name,
          image: emailUser.image || image
        })
        .where(eq(users.id, emailUser.id));

      return {
        id: emailUser.id,
        email: realEmail,
        name: emailUser.name || name,
        image: emailUser.image || image
      };
    }

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
    emailVerified: realEmail ? emailVerified : null,
    generationCredits: 0,
    generationsUsed: 0,
    monthlyFreeUsed: 0,
    monthlyFreePeriodStart: new Date(),
    storyGenerationCredits: 0,
    storyGenerationsUsed: 0,
    storyMonthlyFreeUsed: 0,
    storyMonthlyFreePeriodStart: new Date(),
    storyMonthlyFreePortraitUsed: 0,
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
