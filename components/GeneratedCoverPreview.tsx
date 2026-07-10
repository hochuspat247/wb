"use client";

import { useEffect, useState } from "react";
import type { ProductCardResult } from "@/types/product-card";
import { getGeneratedCoverSrc, getInlineGeneratedCoverSrc } from "@/lib/image";

type GeneratedCoverPreviewProps = {
  card: ProductCardResult;
  displayCard?: ProductCardResult | null;
  reloadToken?: number;
  alt: string;
  className?: string;
};

function appendCacheBuster(url: string, reloadToken: number) {
  if (reloadToken <= 0) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${reloadToken}`;
}

export function GeneratedCoverPreview({
  card,
  displayCard,
  reloadToken = 0,
  alt,
  className
}: GeneratedCoverPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadPreview() {
      const inlineSrc = getInlineGeneratedCoverSrc(card);

      if (inlineSrc) {
        setSrc(inlineSrc);
        return;
      }

      const remoteSrc = getGeneratedCoverSrc(displayCard ?? card);

      if (!remoteSrc) {
        setSrc(null);
        return;
      }

      if (remoteSrc.startsWith("data:")) {
        setSrc(remoteSrc);
        return;
      }

      const requestUrl = appendCacheBuster(remoteSrc, reloadToken);

      try {
        const response = await fetch(requestUrl, { cache: "no-store", credentials: "same-origin" });

        if (!response.ok) {
          throw new Error("preview fetch failed");
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setSrc(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setSrc(requestUrl);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [card, displayCard, reloadToken]);

  if (!src) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={className} src={src} />
  );
}
