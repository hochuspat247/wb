import { createHmac, timingSafeEqual } from "node:crypto";
import type { ProductCardResult } from "@/types/product-card";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

function getSecret() {
  return process.env.GENAPI_CALLBACK_SECRET || process.env.AUTH_SECRET || "marketcard-video-dev-secret";
}

export function getCardSourceImageData(card: ProductCardResult): { base64: string; mimeType: string } | null {
  if (card.generatedImageBase64) {
    return {
      base64: card.generatedImageBase64,
      mimeType: card.generatedImageMimeType || "image/png"
    };
  }

  if (card.generatedImageDataUrl?.startsWith("data:")) {
    const match = card.generatedImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }

  if (card.imageDataUrl?.startsWith("data:")) {
    const match = card.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }

  return null;
}

export function getSourceImageExtension(mimeType: string): "png" | "jpg" | "jpeg" | "webp" {
  const normalized = mimeType.toLowerCase();

  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return "jpg";
  }

  if (normalized === "image/webp") {
    return "webp";
  }

  return "png";
}

export function buildSignedSourceImageUrl(siteUrl: string, orderId: string, extension: string = "png") {
  const expires = Date.now() + DEFAULT_TTL_MS;
  const signature = createHmac("sha256", getSecret()).update(`${orderId}:${expires}`).digest("hex");
  const safeExtension = extension.replace(/^\./, "");

  return `${siteUrl.replace(/\/$/, "")}/api/video/source-image/${orderId}/${expires}/${signature}/image.${safeExtension}`;
}

export function verifySignedSourceImageAccess(orderId: string, expires: string, signature: string) {
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expected = createHmac("sha256", getSecret()).update(`${orderId}:${expiresAt}`).digest("hex");
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actual.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actual, expectedBuffer);
}

export function buildGenApiCallbackUrl(siteUrl: string) {
  const secret = process.env.GENAPI_CALLBACK_SECRET || "";
  const params = secret ? `?secret=${encodeURIComponent(secret)}` : "";
  return `${siteUrl.replace(/\/$/, "")}/api/video/genapi-callback${params}`;
}

export function verifyGenApiCallbackSecret(secret: string | null) {
  const configured = process.env.GENAPI_CALLBACK_SECRET?.trim();
  if (!configured) {
    return true;
  }

  return secret === configured;
}
