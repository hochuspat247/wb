"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import * as VKID from "@vkid/sdk";

type VkIdWidgetProps = {
  callbackUrl?: string;
};

export function VkIdWidget({ callbackUrl = "/cabinet" }: VkIdWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const appId = process.env.NEXT_PUBLIC_VK_APP_ID;
  const redirectUrl =
    process.env.NEXT_PUBLIC_VK_REDIRECT_URL ||
    (typeof window !== "undefined" ? `${window.location.origin}/` : "https://marketcard-ai.avenir-team.ru/");

  useEffect(() => {
    if (!containerRef.current || !appId) {
      return;
    }

    VKID.Config.init({
      app: Number(appId),
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: ""
    });

    const oneTap = new VKID.OneTap();

    oneTap
      .render({
        container: containerRef.current,
        showAlternativeLogin: true,
        oauthList: [VKID.OAuthName.MAIL]
      })
      .on(VKID.WidgetEvents.ERROR, (vkError: unknown) => {
        console.error(vkError);
        setError("Не удалось войти через ВКонтакте. Попробуйте email или Яндекс.");
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
        try {
          setError("");
          const tokenData = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
          const result = await signIn("vk-id", {
            accessToken: tokenData.access_token,
            redirect: false,
            callbackUrl
          });

          if (result?.error) {
            setError("Не удалось создать сессию. Попробуйте ещё раз.");
            return;
          }

          router.push(callbackUrl);
          router.refresh();
        } catch (vkError) {
          console.error(vkError);
          setError("Ошибка авторизации VK ID.");
        }
      });

    return () => {
      containerRef.current?.replaceChildren();
    };
  }, [appId, callbackUrl, redirectUrl, router]);

  if (!appId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="min-h-[48px] overflow-hidden rounded-2xl" ref={containerRef} />
      {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
    </div>
  );
}
