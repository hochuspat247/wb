"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readVkCallbackUrl } from "@/lib/auth/vk-id-client";
import { useVkIdSignIn } from "@/components/auth/useVkIdSignIn";

function VkIdCallbackHandlerInner() {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const callbackUrl = readVkCallbackUrl();
  const signInWithVk = useVkIdSignIn(callbackUrl);

  useEffect(() => {
    const code = searchParams.get("code");
    const deviceId = searchParams.get("device_id");

    if (!code || !deviceId || processedRef.current) {
      return;
    }

    processedRef.current = true;
    setIsProcessing(true);
    setError("");

    signInWithVk({ code, device_id: deviceId }).catch((caught) => {
      console.error("[VK ID] callback failed", caught);
      setError("Не удалось завершить вход через VK. Попробуйте ещё раз или войдите по email.");
      processedRef.current = false;
      setIsProcessing(false);
    });
  }, [searchParams, signInWithVk]);

  if (!error && !isProcessing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl border border-clay bg-card px-4 py-3 text-sm font-semibold text-ink shadow-soft">
      {isProcessing ? "Завершаем вход через VK…" : error}
    </div>
  );
}

export function VkIdCallbackHandler() {
  return (
    <Suspense fallback={null}>
      <VkIdCallbackHandlerInner />
    </Suspense>
  );
}
