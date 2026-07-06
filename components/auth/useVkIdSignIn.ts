"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { completeVkIdLogin } from "@/lib/auth/vk-id-client";

export function useVkIdSignIn(callbackUrl = "/cabinet") {
  const router = useRouter();

  return useCallback(
    async (payload: { code: string; device_id: string }) => {
      const accessToken = await completeVkIdLogin(payload);
      const result = await signIn("vk-id", {
        accessToken,
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        throw new Error("SESSION_FAILED");
      }

      router.push(callbackUrl);
      router.refresh();
    },
    [callbackUrl, router]
  );
}
