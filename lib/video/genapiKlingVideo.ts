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

function getGenApiConfig() {
  const apiKey = process.env.GENAPI_API_KEY?.trim();
  const baseUrl = (process.env.GENAPI_BASE_URL || "https://api.gen-api.ru").replace(/\/$/, "");
  const modelId = process.env.GENAPI_KLING_VIDEO_MODEL_ID || "kling-video-o3";

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

export function normalizeKlingVideoResponse(response: GenApiStatusResponse): GenApiVideoTaskResult {
  const status = normalizeStatus(response.status);
  const videoUrl = extractVideoUrl(response.result ?? response.output);

  return {
    externalTaskId: String(response.request_id || ""),
    status,
    videoUrl: status === "done" ? videoUrl : null,
    error: status === "error" ? response.message || response.error?.toString() || "GenAPI generation failed" : null
  };
}

export function toGenApiAspectRatio(aspectRatio: VideoAspectRatio): "1:1" | "9:16" | "16:9" | null {
  if (aspectRatio === "4:5") {
    return null;
  }

  return aspectRatio;
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

export async function createKlingVideoTask(input: {
  prompt: string;
  startImageUrl: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  quality: VideoQuality;
  callbackUrl?: string;
}): Promise<GenApiVideoTaskResult> {
  const config = getGenApiConfig();

  if (!input.startImageUrl.startsWith("http")) {
    throw new Error("GenAPI requires a public HTTPS URL for start_image_url.");
  }

  const aspectRatio = toGenApiAspectRatio(input.aspectRatio);
  const duration = String(input.duration);

  if (!(GENAPI_VIDEO_DURATIONS as readonly string[]).includes(duration)) {
    throw new Error(`Unsupported video duration: ${duration}. Allowed: ${GENAPI_VIDEO_DURATIONS.join(", ")} sec.`);
  }

  const body: Record<string, unknown> = {
    prompt: input.prompt,
    model: "image-to-video",
    start_image_url: input.startImageUrl,
    duration,
    translate_input: false,
    generate_audio: false,
    keep_audio: false,
    shot_type: "customize"
  };

  if (aspectRatio) {
    body.aspect_ratio = aspectRatio;
  }

  if (input.quality === "pro") {
    body.pro = true;
  }

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

export async function getKlingVideoTaskStatus(externalTaskId: string): Promise<GenApiVideoTaskResult> {
  const response = await callGenApi<GenApiStatusResponse>(`/api/v1/request/get/${externalTaskId}`, {
    method: "GET"
  });

  return normalizeKlingVideoResponse(response);
}
