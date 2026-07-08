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

type EmailVerificationSubject = {
  email: string;
  emailVerified?: Date | null | boolean;
  passwordHash?: string | null;
  hasPasswordAccount?: boolean;
};

function hasPasswordAccount(user: EmailVerificationSubject) {
  return Boolean(user.passwordHash ?? user.hasPasswordAccount);
}

function isEmailVerified(emailVerified?: Date | null | boolean) {
  return Boolean(emailVerified);
}

export function userNeedsEmailVerification(user: EmailVerificationSubject) {
  if (isPlaceholderOAuthEmail(user.email)) {
    return false;
  }

  if (isEmailVerified(user.emailVerified)) {
    return false;
  }

  return hasPasswordAccount(user);
}

export function getEmailVerificationLabel(user: EmailVerificationSubject) {
  if (isPlaceholderOAuthEmail(user.email)) {
    return "Соцсеть";
  }

  if (isEmailVerified(user.emailVerified)) {
    return "Подтверждён";
  }

  if (hasPasswordAccount(user)) {
    return "Не подтверждён";
  }

  return "OAuth";
}
