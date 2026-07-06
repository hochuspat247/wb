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
    joinedAt: string;
    quota?: {
      credits: number;
      used: number;
      remaining: number;
      canGenerate: boolean;
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
