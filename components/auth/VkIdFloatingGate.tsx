"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { VkIdFloating } from "@/components/auth/VkIdFloating";
import { STORY_INTENDED_STORY_KEY, buildStoryCabinetFromDemoUrl } from "@/lib/guest";

const hiddenPaths = ["/login", "/register", "/cabinet"];

function resolveFloatingCallbackUrl(pathname: string) {
  if (pathname.startsWith("/storystudio")) {
    const intendedStoryId = window.localStorage.getItem(STORY_INTENDED_STORY_KEY);
    if (intendedStoryId) {
      return buildStoryCabinetFromDemoUrl(intendedStoryId);
    }
    return "/storystudio/cabinet";
  }

  if (pathname.startsWith("/kvartovid")) {
    return "/kvartovid/cabinet";
  }

  return "/cabinet";
}

export function VkIdFloatingGate() {
  const { status } = useSession();
  const pathname = usePathname();
  const [callbackUrl, setCallbackUrl] = useState("/cabinet");

  useEffect(() => {
    setCallbackUrl(resolveFloatingCallbackUrl(pathname));
  }, [pathname]);

  if (status === "authenticated") {
    return null;
  }

  if (hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_VK_APP_ID) {
    return null;
  }

  return <VkIdFloating callbackUrl={callbackUrl} />;
}
