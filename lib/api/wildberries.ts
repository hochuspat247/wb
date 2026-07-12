import type {
  WildberriesCardsListResult,
  WildberriesCatalogCard,
  WildberriesIntegrationStatus,
  WildberriesPublishInput,
  WildberriesPublishResult,
  WildberriesSubject,
  WildberriesUpdateInput,
  WildberriesUpdateResult
} from "@/types/wildberries";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || fallback;
}

export async function fetchWildberriesSettings() {
  const response = await fetch("/api/wildberries/settings", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось загрузить настройки WB."));
  }
  return response.json() as Promise<WildberriesIntegrationStatus>;
}

export async function saveWildberriesSettings(input: { token: string; isSandbox: boolean }) {
  const response = await fetch("/api/wildberries/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось подключить WB API."));
  }

  return response.json() as Promise<WildberriesIntegrationStatus>;
}

export async function disconnectWildberries() {
  const response = await fetch("/api/wildberries/settings", { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось отключить WB API."));
  }
  return response.json() as Promise<WildberriesIntegrationStatus>;
}

export async function searchWildberriesSubjects(query: string) {
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/wildberries/subjects?${params.toString()}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось найти категории WB."));
  }

  const data = (await response.json()) as { subjects: WildberriesSubject[] };
  return data.subjects;
}

export async function publishWildberriesCard(input: WildberriesPublishInput) {
  const response = await fetch("/api/wildberries/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = (await response.json().catch(() => null)) as
    | WildberriesPublishResult
    | { error?: string; code?: string }
    | null;

  if (!response.ok) {
    throw new Error(data && "error" in data && data.error ? data.error : "Не удалось создать карточку в WB.");
  }

  return data as WildberriesPublishResult;
}

export async function fetchWildberriesCards(input?: {
  search?: string;
  limit?: number;
  updatedAt?: string;
  nmId?: number;
  source?: "active" | "trash";
}) {
  const params = new URLSearchParams();
  if (input?.search) params.set("search", input.search);
  if (input?.limit) params.set("limit", String(input.limit));
  if (input?.updatedAt) params.set("updatedAt", input.updatedAt);
  if (input?.nmId) params.set("nmId", String(input.nmId));
  if (input?.source) params.set("source", input.source);

  const response = await fetch(`/api/wildberries/cards?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось загрузить карточки WB."));
  }

  return response.json() as Promise<WildberriesCardsListResult>;
}

export async function fetchWildberriesCard(nmId: number) {
  const response = await fetch(`/api/wildberries/cards/${nmId}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось загрузить карточку WB."));
  }

  const data = (await response.json()) as { card: WildberriesCatalogCard };
  return data.card;
}

export async function updateWildberriesCard(nmId: number, input: Omit<WildberriesUpdateInput, "nmId">) {
  const response = await fetch(`/api/wildberries/cards/${nmId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Не удалось обновить карточку WB."));
  }

  return response.json() as Promise<WildberriesUpdateResult>;
}
