const PLACEHOLDER_EMAIL_SUFFIX = "@oauth.marketcard.local";

export function isPlaceholderOAuthEmail(email?: string | null) {
  if (!email) return true;
  return email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_SUFFIX);
}

export function formatAccountEmail(email?: string | null) {
  if (!email || isPlaceholderOAuthEmail(email)) {
    return "Вход через соцсеть — email не указан";
  }
  return email;
}

export function needsEmailVerification(email?: string | null, emailVerified?: Date | null | boolean) {
  if (isPlaceholderOAuthEmail(email)) {
    return false;
  }
  return !emailVerified;
}
