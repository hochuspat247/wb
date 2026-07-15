"use client";

import { useEffect, useRef, useState } from "react";
import * as VKID from "@vkid/sdk";
import { initVkIdConfig } from "@/lib/auth/vk-id-client";
import { useVkIdSignIn } from "@/components/auth/useVkIdSignIn";

type VkIdOAuthListProps = {
  callbackUrl?: string;
};

export function VkIdOAuthList({ callbackUrl = "/cabinet" }: VkIdOAuthListProps) {
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

    const container = containerRef.current;

    try {
      const oAuth = new VKID.OAuthList();

      oAuth
        .render({
          container,
          oauthList: [VKID.OAuthName.VK, VKID.OAuthName.MAIL]
        })
        .on(VKID.WidgetEvents.ERROR, (vkError: unknown) => {
          const message = vkError instanceof Error ? vkError.message : String(vkError ?? "");
          if (/failed to fetch|networkerror|load failed/i.test(message)) {
            setAvailable(false);
            return;
          }
          setError("Не удалось войти через ВКонтакте.");
        })
        .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
          try {
            setError("");
            await signInWithVk(payload);
          } catch (vkError) {
            console.warn("[VK ID] sign-in failed", vkError);
            setError("Ошибка авторизации VK ID.");
          }
        });

      return () => {
        container.replaceChildren();
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
      <div className="min-h-[44px] overflow-hidden rounded-2xl" ref={containerRef} />
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
