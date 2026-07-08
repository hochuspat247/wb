import { isPlaceholderOAuthEmail } from "@/lib/auth/email-utils";

const EMAIL_FORMAT_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\.[a-z]{2,63}$/i;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailFormatError(email: string) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return "Укажите email.";
  }

  if (normalized.length > 254) {
    return "Email слишком длинный.";
  }

  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain || normalized.split("@").length !== 2) {
    return "Укажите корректный email.";
  }

  if (localPart.length > 64) {
    return "Локальная часть email слишком длинная.";
  }

  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return "Укажите корректный email.";
  }

  if (!EMAIL_FORMAT_RE.test(normalized)) {
    return "Укажите корректный email.";
  }

  if (isPlaceholderOAuthEmail(normalized)) {
    return "Укажите реальный email.";
  }

  return null;
}

export function isValidEmailFormat(email: string) {
  return !getEmailFormatError(email);
}
