"use client";

import { useEffect, useRef, useState } from "react";
import * as VKID from "@vkid/sdk";
import { getVkAppName, initVkIdConfig, storeVkCallbackUrl } from "@/lib/auth/vk-id-client";
import { useVkIdSignIn } from "@/components/auth/useVkIdSignIn";

type VkIdFloatingProps = {
  callbackUrl?: string;
};

export function VkIdFloating({ callbackUrl = "/cabinet" }: VkIdFloatingProps) {
  const widgetRef = useRef<VKID.FloatingOneTap | null>(null);
  const [error, setError] = useState("");
  const signInWithVk = useVkIdSignIn(callbackUrl);

  useEffect(() => {
    storeVkCallbackUrl(callbackUrl);

    if (!initVkIdConfig()) {
      return;
    }

    try {
      const floatingOneTap = new VKID.FloatingOneTap();
      widgetRef.current = floatingOneTap;

      floatingOneTap
        .render({
          appName: getVkAppName(),
          showAlternativeLogin: true,
          oauthList: [VKID.OAuthName.MAIL]
        })
        .on(VKID.WidgetEvents.ERROR, (vkError: unknown) => {
          const message = vkError instanceof Error ? vkError.message : String(vkError ?? "");
          if (/failed to fetch|networkerror|load failed/i.test(message)) {
            return;
          }
          setError("Не удалось войти через VK ID.");
        })
        .on(VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
          try {
            setError("");
            await signInWithVk(payload);
            floatingOneTap.close();
          } catch (vkError) {
            console.warn("[VK ID] floating sign-in failed", vkError);
            setError("Ошибка входа через VK ID.");
          }
        });

      return () => {
        floatingOneTap.close();
        widgetRef.current = null;
      };
    } catch (vkError) {
      const message = vkError instanceof Error ? vkError.message : String(vkError ?? "");
      if (!/failed to fetch|networkerror|load failed/i.test(message)) {
        console.warn("[VK ID] floating init failed", vkError);
      }
      return undefined;
    }
  }, [callbackUrl, signInWithVk]);

  if (error) {
    return (
      <div className="fixed bottom-24 right-4 z-[70] max-w-xs rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-soft">
        {error}
      </div>
    );
  }

  return null;
}
