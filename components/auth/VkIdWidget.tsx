"use client";

import { useEffect, useRef, useState } from "react";
import * as VKID from "@vkid/sdk";
import { initVkIdConfig } from "@/lib/auth/vk-id-client";
import { useVkIdSignIn } from "@/components/auth/useVkIdSignIn";

type VkIdWidgetProps = {
  callbackUrl?: string;
};

export function VkIdWidget({ callbackUrl = "/cabinet" }: VkIdWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState(true);
  const signInWithVk = useVkIdSignIn(callbackUrl);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!initVkIdConfig()) {
      setAvailable(false);
      return;
    }

    try {
      const oneTap = new VKID.OneTap();

      oneTap
        .render({
          container: containerRef.current,
          showAlternativeLogin: true,
          oauthList: [VKID.OAuthName.MAIL]
        })
        .on(VKID.WidgetEvents.ERROR, (vkError: unknown) => {
          const message = vkError instanceof Error ? vkError.message : String(vkError ?? "");
          if (/failed to fetch|networkerror|load failed/i.test(message)) {
            setAvailable(false);
            return;
          }
          setError("Не удалось войти через ВКонтакте. Попробуйте email или Яндекс.");
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
          try {
            setError("");
            await signInWithVk(payload);
          } catch (vkError) {
            console.warn("[VK ID] sign-in failed", vkError);
            setError("Ошибка авторизации VK ID.");
          }
        });

      return () => {
        containerRef.current?.replaceChildren();
      };
    } catch (vkError) {
      const message = vkError instanceof Error ? vkError.message : String(vkError ?? "");
      if (!/failed to fetch|networkerror|load failed/i.test(message)) {
        console.warn("[VK ID] widget init failed", vkError);
      }
      setAvailable(false);
      return undefined;
    }
  }, [callbackUrl, signInWithVk]);

  if (!process.env.NEXT_PUBLIC_VK_APP_ID || !available) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="min-h-[48px] overflow-hidden rounded-2xl" ref={containerRef} />
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
