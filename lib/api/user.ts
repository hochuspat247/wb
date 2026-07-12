import type { ProductCardResult } from "@/types/product-card";

export async function fetchUserCards() {
  const response = await fetch("/api/cards", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("FAILED_TO_LOAD_CARDS");
  }
  const data = (await response.json()) as { cards: ProductCardResult[] };
  return data.cards;
}

export async function saveUserCardRemote(card: ProductCardResult) {
  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card })
  });

  if (!response.ok) {
    throw new Error("FAILED_TO_SAVE_CARD");
  }

  const data = (await response.json()) as { cards: ProductCardResult[] };
  return data.cards;
}

export async function migrateLocalCards(cards: ProductCardResult[]) {
  if (!cards.length) {
    return [];
  }

  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards })
  });

  if (!response.ok) {
    throw new Error("FAILED_TO_MIGRATE_CARDS");
  }

  const data = (await response.json()) as { cards: ProductCardResult[] };
  return data.cards;
}

export async function migrateGuestGenerations(guestId: string) {
  if (!guestId.trim()) {
    return 0;
  }

  const response = await fetch("/api/generations/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId })
  });

  if (!response.ok) {
    throw new Error("FAILED_TO_MIGRATE_GUEST_GENERATIONS");
  }

  const data = (await response.json()) as { migrated: number };
  return data.migrated;
}

export async function removeUserCardRemote(id: string) {
  const response = await fetch(`/api/cards/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("FAILED_TO_REMOVE_CARD");
  }
  const data = (await response.json()) as { cards: ProductCardResult[] };
  return data.cards;
}

export async function clearUserCardsRemote() {
  const response = await fetch("/api/cards", { method: "DELETE" });
  if (!response.ok) {
    throw new Error("FAILED_TO_CLEAR_CARDS");
  }
  return [];
}

export async function fetchUserQuota() {
  const response = await fetch("/api/quota", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("FAILED_TO_LOAD_QUOTA");
  }
  return response.json() as Promise<{
    credits: number;
    used: number;
    remaining: number;
    canGenerate: boolean;
    unlimited?: boolean;
    storyPremiumUnlocked?: boolean;
    cleanDownloadGenerationId?: string | null;
    downloadsFullyUnlocked?: boolean;
    wildberriesUnlocked?: boolean;
  }>;
}

export async function fetchUserProfile() {
  const response = await fetch("/api/profile", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("FAILED_TO_LOAD_PROFILE");
  }
  return response.json() as Promise<{
    name: string;
    email: string;
    emailVerified?: boolean;
    emailIsPlaceholder?: boolean;
    emailDisplay?: string;
    needsEmailVerification?: boolean;
    joinedAt: string;
    quota?: {
      credits: number;
      used: number;
      remaining: number;
      canGenerate: boolean;
      unlimited?: boolean;
    };
  }>;
}

export async function updateUserProfile(name: string) {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error("FAILED_TO_UPDATE_PROFILE");
  }

  return response.json() as Promise<{ name: string }>;
}

export async function createPayment(count: number, customerEmail?: string) {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, customerEmail })
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    const data = (await response.json().catch(() => null)) as { code?: string; error?: string } | null;
    if (data?.code === "EMAIL_REQUIRED") {
      throw new Error("EMAIL_REQUIRED");
    }
    throw new Error(data?.error || "FAILED_TO_CREATE_PAYMENT");
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    confirmationUrl: string;
  }>;
}
