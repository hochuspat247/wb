"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { VkIdFloating } from "@/components/auth/VkIdFloating";

const hiddenPaths = ["/login", "/register", "/cabinet"];

export function VkIdFloatingGate() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status === "authenticated") {
    return null;
  }

  if (hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_VK_APP_ID) {
    return null;
  }

  return <VkIdFloating callbackUrl="/cabinet" />;
}
