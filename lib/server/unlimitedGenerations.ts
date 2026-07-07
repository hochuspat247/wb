type UnlimitedUser = {
  name?: string | null;
  email?: string;
};

const UNLIMITED_REMAINING = 999_999;

export function getUnlimitedRemainingCount() {
  return UNLIMITED_REMAINING;
}

function getUnlimitedNames() {
  return (process.env.UNLIMITED_GENERATION_NAMES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getUnlimitedEmails() {
  return (process.env.UNLIMITED_GENERATION_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function hasUnlimitedGenerations(user: UnlimitedUser) {
  const userName = user.name?.trim().toLowerCase() || "";
  const userEmail = user.email?.trim().toLowerCase() || "";

  if (userEmail && getUnlimitedEmails().includes(userEmail)) {
    return true;
  }

  return getUnlimitedNames().some((name) => userName === name);
}
