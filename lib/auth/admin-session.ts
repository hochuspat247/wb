import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const DEFAULT_ADMIN_LOGIN = "1234";
const DEFAULT_ADMIN_PASSWORD = "1234admin";

export const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || DEFAULT_ADMIN_LOGIN).trim();
export const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD).trim();
export const ADMIN_COOKIE_NAME = "mc_admin_session";

function getAdminSessionSecret() {
  return process.env.AUTH_SECRET || "marketcard-admin-dev-secret";
}

function normalizeCredential(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/a/g, "а");
}

export function createAdminSessionToken() {
  return createHmac("sha256", getAdminSessionSecret()).update("marketcard-admin-v1").digest("hex");
}

export function verifyAdminCredentials(login: string, password: string) {
  return (
    normalizeCredential(login) === normalizeCredential(ADMIN_LOGIN) &&
    normalizeCredential(password) === normalizeCredential(ADMIN_PASSWORD)
  );
}

export function isValidAdminSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const expected = createAdminSessionToken();

  try {
    const left = Buffer.from(token);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSessionCookie() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
