import type {
  CreateVideoOrderInput,
  CreateVideoOrderResponse,
  VideoGenerationRecord,
  VideoOrderStatusResponse
} from "@/types/video-generation";

export async function createVideoOrder(input: CreateVideoOrderInput & { useVideoCredit?: boolean; customerEmail?: string }) {
  const response = await fetch("/api/video/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as CreateVideoOrderResponse & { error?: string; code?: string };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось создать заказ на видео.");
  }

  return data;
}

export async function fetchVideoOrderStatus(orderId: string) {
  const response = await fetch(`/api/video/orders/${orderId}/status`);
  const data = (await response.json()) as VideoOrderStatusResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось получить статус видео.");
  }

  return data;
}

export async function fetchVideoHistory() {
  const response = await fetch("/api/video/history");
  const data = (await response.json()) as { orders: VideoGenerationRecord[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось загрузить историю видео.");
  }

  return data.orders;
}

export async function fetchVideoCredits() {
  const response = await fetch("/api/profile");
  const data = (await response.json()) as { videoCredits?: number };

  if (!response.ok) {
    return 0;
  }

  return data.videoCredits ?? 0;
}
