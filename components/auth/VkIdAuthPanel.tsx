"use client";

import { useEffect } from "react";
import { VkIdOAuthList } from "@/components/auth/VkIdOAuthList";
import { VkIdWidget } from "@/components/auth/VkIdWidget";
import { storeVkCallbackUrl } from "@/lib/auth/vk-id-client";

type VkIdAuthPanelProps = {
  callbackUrl?: string;
};

export function VkIdAuthPanel({ callbackUrl = "/cabinet" }: VkIdAuthPanelProps) {
  useEffect(() => {
    storeVkCallbackUrl(callbackUrl);
  }, [callbackUrl]);

  if (!process.env.NEXT_PUBLIC_VK_APP_ID) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <VkIdOAuthList callbackUrl={callbackUrl} />
      <VkIdWidget callbackUrl={callbackUrl} />
    </div>
  );
}
