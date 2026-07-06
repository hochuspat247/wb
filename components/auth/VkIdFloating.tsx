"use client";

import { useEffect, useRef, useState } from "react";
import * as VKID from "@vkid/sdk";
import { getVkAppName, initVkIdConfig } from "@/lib/auth/vk-id-client";
import { useVkIdSignIn } from "@/components/auth/useVkIdSignIn";

type VkIdFloatingProps = {
  callbackUrl?: string;
};

export function VkIdFloating({ callbackUrl = "/cabinet" }: VkIdFloatingProps) {
  const widgetRef = useRef<VKID.FloatingOneTap | null>(null);
  const [error, setError] = useState("");
  const signInWithVk = useVkIdSignIn(callbackUrl);

  useEffect(() => {
    if (!initVkIdConfig()) {
      return;
    }

    const floatingOneTap = new VKID.FloatingOneTap();
    widgetRef.current = floatingOneTap;

    floatingOneTap
      .render({
        appName: getVkAppName(),
        showAlternativeLogin: true,
        oauthList: [VKID.OAuthName.MAIL]
      })
      .on(VKID.WidgetEvents.ERROR, (vkError: unknown) => {
        console.error(vkError);
        setError("Не удалось войти через VK ID.");
      })
      .on(VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
        try {
          setError("");
          await signInWithVk(payload);
          floatingOneTap.close();
        } catch (vkError) {
          console.error(vkError);
          setError("Ошибка входа через VK ID.");
        }
      });

    return () => {
      floatingOneTap.close();
      widgetRef.current = null;
    };
  }, [callbackUrl, signInWithVk]);

  if (error) {
    return (
      <div className="fixed bottom-24 right-4 z-[70] max-w-xs rounded-2xl border border-coral/20 bg-white px-4 py-3 text-sm font-semibold text-coral shadow-soft">
        {error}
      </div>
    );
  }

  return null;
}
