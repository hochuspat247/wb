import { GENAPI_VIDEO_DURATIONS } from "@/config/video-pricing";
import type { VideoAspectRatio, VideoDuration, VideoQuality } from "@/types/video-generation";

type GenApiCreateResponse = {
  request_id?: number | string;
  model?: string;
  status?: string;
  message?: string;
  error?: string | boolean;
  errors_validation?: Record<string, string[] | string>;
};

type GenApiStatusResponse = {
  request_id?: number | string;
  status?: string;
  response_type?: string;
  result?: unknown;
  output?: unknown;
  message?: string;
  error?: string;
};

export type GenApiVideoTaskResult = {
  externalTaskId: string;
  status: "queued" | "processing" | "done" | "error";
  videoUrl: string | null;
  error: string | null;
};

const DEFAULT_MODEL_ID = "veo-3-1-fast";

const VEO_NEGATIVE_PROMPT =
  "distorted text, garbled letters, misspelled Cyrillic, unreadable typography, warped Russian words, morphing text, " +
  "text regeneration, rewritten headline, deformed packaging, deformed product, chaotic camera movement, " +
  "scene replacement, new objects, water splash, smoke effects, watermark, logo artifacts, blur, low quality";

function getGenApiConfig() {
  const apiKey = process.env.GENAPI_API_KEY?.trim();
  const baseUrl = (process.env.GENAPI_BASE_URL || "https://api.gen-api.ru").replace(/\/$/, "");
  const modelId =
    process.env.GENAPI_VIDEO_MODEL_ID?.trim() ||
    process.env.GENAPI_KLING_VIDEO_MODEL_ID?.trim() ||
    DEFAULT_MODEL_ID;

  if (!apiKey) {
    throw new Error("GENAPI_API_KEY is required");
  }

  return { apiKey, baseUrl, modelId };
}

function formatGenApiError(status: number, data: Record<string, unknown>) {
  const validation = data.errors_validation;
  if (validation && typeof validation === "object") {
    const parts = Object.entries(validation).map(([key, value]) => {
      const message = Array.isArray(value) ? value.join(", ") : String(value);
      return `${key}: ${message}`;
    });

    if (parts.length > 0) {
      return parts.join("; ");
    }
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  return `GenAPI error ${status}`;
}

function extractVideoUrl(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string" && payload.startsWith("http")) {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const url = extractVideoUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const directKeys = ["video_url", "videoUrl", "url", "output", "result", "file", "video"];

    for (const key of directKeys) {
      const value = record[key];
      const url = extractVideoUrl(value);
      if (url) return url;
    }

    for (const value of Object.values(record)) {
      const url = extractVideoUrl(value);
      if (url) return url;
    }
  }

  return null;
}

function normalizeStatus(status?: string): GenApiVideoTaskResult["status"] {
  const normalized = (status || "").toLowerCase();

  if (["success", "succeed", "completed", "done", "finished"].includes(normalized)) {
    return "done";
  }

  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "error";
  }

  if (["processing", "running", "started", "starting"].includes(normalized)) {
    return "processing";
  }

  return "queued";
}

export function normalizeVeoVideoResponse(response: GenApiStatusResponse): GenApiVideoTaskResult {
  const status = normalizeStatus(response.status);
  const videoUrl = extractVideoUrl(response.output ?? response.result);

  return {
    externalTaskId: String(response.request_id || ""),
    status,
    videoUrl: status === "done" ? videoUrl : null,
    error: status === "error" ? response.message || response.error?.toString() || "GenAPI generation failed" : null
  };
}

export function resolveVeoAspectRatio(aspectRatio: VideoAspectRatio): "16:9" | "9:16" {
  if (aspectRatio === "16:9") {
    return "16:9";
  }

  // Veo 3.1 Fast поддерживает только 16:9 и 9:16. Форматы карточки маппим в вертикальное 9:16.
  return "9:16";
}

/** @deprecated Используйте resolveVeoAspectRatio. */
export function toVeoAspectRatio(aspectRatio: VideoAspectRatio): "16:9" | "9:16" {
  return resolveVeoAspectRatio(aspectRatio);
}

function toVeoResolution(quality: VideoQuality): "720p" | "1080p" | "4k" {
  if (quality === "pro") {
    return "4k";
  }

  return "1080p";
}

function formatVeoDuration(duration: VideoDuration): string {
  return `${duration}s`;
}

async function callGenApi<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getGenApiConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers
    },
    cache: "no-store"
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok || data.error === true || (typeof data.error === "string" && data.error)) {
    throw new Error(formatGenApiError(response.status, data));
  }

  return data as T;
}

export async function createVeoVideoTask(input: {
  prompt: string;
  startImageUrl: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  quality: VideoQuality;
  generateAudio?: boolean;
  callbackUrl?: string;
}): Promise<GenApiVideoTaskResult> {
  const config = getGenApiConfig();

  if (!input.startImageUrl.startsWith("http")) {
    throw new Error("GenAPI requires a public HTTPS URL for image_urls.");
  }

  const duration = String(input.duration);
  if (!(GENAPI_VIDEO_DURATIONS as readonly string[]).includes(duration)) {
    throw new Error(`Unsupported video duration: ${duration}. Allowed: ${GENAPI_VIDEO_DURATIONS.join(", ")} sec.`);
  }

  const aspectRatio = resolveVeoAspectRatio(input.aspectRatio);

  const body: Record<string, unknown> = {
    prompt: input.prompt,
    image_urls: [input.startImageUrl],
    duration: formatVeoDuration(input.duration),
    resolution: toVeoResolution(input.quality),
    aspect_ratio: aspectRatio,
    generate_audio: Boolean(input.generateAudio),
    enhance_prompt: false,
    auto_fix: false,
    negative_prompt: VEO_NEGATIVE_PROMPT
  };

  if (input.callbackUrl) {
    body.callback_url = input.callbackUrl;
  }

  const created = await callGenApi<GenApiCreateResponse>(`/api/v1/networks/${config.modelId}`, {
    method: "POST",
    body: JSON.stringify(body)
  });

  const externalTaskId = String(created.request_id || "");

  if (!externalTaskId) {
    throw new Error("GenAPI did not return request_id");
  }

  return {
    externalTaskId,
    status: normalizeStatus(created.status),
    videoUrl: null,
    error: null
  };
}

export async function getVeoVideoTaskStatus(externalTaskId: string): Promise<GenApiVideoTaskResult> {
  const response = await callGenApi<GenApiStatusResponse>(`/api/v1/request/get/${externalTaskId}`, {
    method: "GET"
  });

  return normalizeVeoVideoResponse(response);
}

export function getGenApiVideoModelId() {
  return getGenApiConfig().modelId;
}
