import { createHmac } from "node:crypto";
import { calculateVideoPriceRub } from "@/config/video-pricing";
import type { GenerateVideoInput, GenerateVideoResult } from "@/types/product-card";

type KlingTaskStatus = "submitted" | "processing" | "succeed" | "failed" | string;

type KlingTaskVideo = {
  id?: string;
  url?: string;
  duration?: string | number;
};

type KlingTaskResponse = {
  code?: number;
  message?: string;
  request_id?: string;
  data?: {
    task_id?: string;
    task_status?: KlingTaskStatus;
    task_status_msg?: string;
    task_result?: {
      videos?: KlingTaskVideo[];
    };
    created_at?: number;
    updated_at?: number;
  };
};

const KLING_DEFAULT_BASE_URL = "https://api-singapore.klingai.com";
const KLING_VIDEO_DURATION_SECONDS = 8;
const KLING_VIDEO_PRICE_RUB = calculateVideoPriceRub("8", "standard");

function isDirectKlingApiKey(key: string) {
  return key.startsWith("api-key-kling-");
}

function resolveKlingAuthToken() {
  const apiKey = (process.env.KLING_API_KEY || process.env.KLING_ACCESS_KEY || "").trim();
  const secretKey = (process.env.KLING_SECRET_KEY || "").trim();

  if (!apiKey) {
    throw new Error("KLING_API_KEY or KLING_ACCESS_KEY is required");
  }

  if (isDirectKlingApiKey(apiKey)) {
    return apiKey;
  }

  if (!secretKey) {
    throw new Error("KLING_SECRET_KEY is required for JWT authentication");
  }

  return createKlingJwt(apiKey, secretKey);
}

function getKlingConfig() {
  return {
    baseUrl: (process.env.KLING_BASE_URL || KLING_DEFAULT_BASE_URL).replace(/\/$/, ""),
    model: process.env.KLING_VIDEO_MODEL || "kling-v1-6",
    mode: process.env.KLING_VIDEO_MODE || "std"
  };
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function createKlingJwt(accessKey: string, secretKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 5
    })
  );
  const signature = createHmac("sha256", secretKey)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

async function callKling<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getKlingConfig();
  const token = resolveKlingAuthToken();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers
    }
  });

  const data = (await response.json().catch(() => ({}))) as KlingTaskResponse;

  if (!response.ok || (typeof data.code === "number" && data.code !== 0)) {
    throw new Error(data.message || `Kling API error ${response.status}`);
  }

  return data as T;
}

function normalizePrompt(input: GenerateVideoInput) {
  return [
    input.prompt,
    input.title ? `Product: ${input.title}` : "",
    input.productDescription ? `Description: ${input.productDescription}` : "",
    input.style ? `Style: ${input.style}` : "",
    "Create a short marketplace product promo video with smooth camera motion, clean lighting, premium composition, no readable text overlays."
  ]
    .filter(Boolean)
    .join("\n");
}

function toVideoResult(response: KlingTaskResponse, prompt: string): GenerateVideoResult {
  const task = response.data;
  const video = task?.task_result?.videos?.[0];

  return {
    taskId: task?.task_id || "",
    status: task?.task_status || "submitted",
    statusMessage: task?.task_status_msg,
    videoUrl: video?.url || null,
    durationSeconds: KLING_VIDEO_DURATION_SECONDS,
    provider: "Kling AI",
    model: process.env.KLING_VIDEO_MODEL || "kling-v1-6",
    prompt,
    generatedAt: new Date().toISOString(),
    priceRub: KLING_VIDEO_PRICE_RUB
  };
}

export async function createKlingVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  const config = getKlingConfig();
  const prompt = normalizePrompt(input);
  const image = input.imageBase64 || input.imageUrl;
  const endpoint = image ? "/v1/videos/image2video" : "/v1/videos/text2video";
  const body = {
    model_name: input.model || config.model,
    prompt,
    negative_prompt: input.negativePrompt || "blur, distortion, poor quality, unreadable text, watermark, logo artifacts",
    mode: input.mode || config.mode,
    duration: String(KLING_VIDEO_DURATION_SECONDS),
    aspect_ratio: input.aspectRatio || "9:16",
    ...(image ? { image } : {})
  };

  const created = await callKling<KlingTaskResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const taskId = created.data?.task_id;

  if (!taskId) {
    throw new Error("Kling did not return task_id");
  }

  return pollKlingVideo(taskId, prompt, image ? "image2video" : "text2video");
}

export async function pollKlingVideo(
  taskId: string,
  prompt = "",
  taskType: "image2video" | "text2video" = "image2video"
): Promise<GenerateVideoResult> {
  const startedAt = Date.now();
  const timeoutMs = Number(process.env.KLING_VIDEO_MAX_POLL_MS || 150000);
  const intervalMs = Number(process.env.KLING_VIDEO_POLL_INTERVAL_MS || 5000);

  while (Date.now() - startedAt <= timeoutMs) {
    const response = await callKling<KlingTaskResponse>(`/v1/videos/${taskType}/${taskId}`, {
      method: "GET"
    }).catch(async (error) => {
      if (taskType === "image2video") {
        return callKling<KlingTaskResponse>(`/v1/videos/text2video/${taskId}`, { method: "GET" });
      }

      throw error;
    });
    const result = toVideoResult(response, prompt);

    if (result.status === "succeed" || result.status === "failed") {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    taskId,
    status: "processing",
    statusMessage: "Видео ещё генерируется. Повторите проверку статуса позже.",
    videoUrl: null,
    durationSeconds: KLING_VIDEO_DURATION_SECONDS,
    provider: "Kling AI",
    model: process.env.KLING_VIDEO_MODEL || "kling-v1-6",
    prompt,
    generatedAt: new Date().toISOString(),
    priceRub: KLING_VIDEO_PRICE_RUB
  };
}
