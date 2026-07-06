const PROFILE_KEY = "marketcard-ai-profile";

export type UserProfile = {
  name: string;
  joinedAt: string;
};

const defaultProfile: UserProfile = {
  name: "Продавец",
  joinedAt: new Date().toISOString()
};

export function getProfile(): UserProfile {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return defaultProfile;
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: parsed.name?.trim() || defaultProfile.name,
      joinedAt: parsed.joinedAt || defaultProfile.joinedAt
    };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getProfile();
  const next: UserProfile = {
    name: profile.name?.trim() || current.name,
    joinedAt: current.joinedAt
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }

  return next;
}
