import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "@auth/core/errors";
import { authConfig } from "@/auth.config";
import { authenticateVkAccessToken } from "@/lib/auth/vk-id-server";
import { isPlaceholderOAuthEmail, userNeedsEmailVerification } from "@/lib/auth/email-utils";
import { Yandex } from "@/lib/auth/providers/yandex";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

class EmailNotVerified extends CredentialsSignin {
  static type = "EmailNotVerified";
}

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Пароль", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.toString().trim().toLowerCase();
      const password = credentials?.password?.toString() ?? "";

      if (!email || !password) {
        return null;
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user?.passwordHash) {
        return null;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return null;
      }

      if (userNeedsEmailVerification(user)) {
        throw new EmailNotVerified();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      };
    }
  }),
  Credentials({
    id: "vk-id",
    name: "VK ID",
    credentials: {
      accessToken: { label: "Access Token", type: "text" }
    },
    async authorize(credentials) {
      const accessToken = credentials?.accessToken?.toString();
      if (!accessToken) {
        return null;
      }

      try {
        return await authenticateVkAccessToken(accessToken);
      } catch (error) {
        console.error("[MarketCard AI] VK authorize failed", error);
        return null;
      }
    }
  })
];

if (process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET) {
  providers.push(
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID,
      clientSecret: process.env.AUTH_YANDEX_SECRET
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "yandex" && user.email && !isPlaceholderOAuthEmail(user.email)) {
        await db
          .update(users)
          .set({ emailVerified: new Date() })
          .where(eq(users.email, user.email));
      }

      return true;
    }
  },
  providers
});
