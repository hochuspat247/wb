"use client";

import { useCallback } from "react";
import { signIn } from "next-auth/react";
import {
  clearVkAuthParamsFromUrl,
  completeVkIdLogin,
  storeVkCallbackUrl
} from "@/lib/auth/vk-id-client";
import { recordSignupContext } from "@/lib/auth/signup-context-client";

export function useVkIdSignIn(callbackUrl = "/cabinet") {
  return useCallback(
    async (payload: { code: string; device_id: string }) => {
      storeVkCallbackUrl(callbackUrl);

      const accessToken = await completeVkIdLogin(payload);

      if (!accessToken) {
        throw new Error("VK_TOKEN_EMPTY");
      }

      const result = await signIn("vk-id", {
        accessToken,
        redirect: false,
        callbackUrl
      });

      if (result?.error || result?.ok === false) {
        throw new Error(result?.error || "SESSION_FAILED");
      }

      await recordSignupContext({ callbackUrl, source: "vk" });
      clearVkAuthParamsFromUrl();
      window.location.assign(callbackUrl);
    },
    [callbackUrl]
  );
}
