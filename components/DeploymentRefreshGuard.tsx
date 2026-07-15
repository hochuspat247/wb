"use client";

import { useCallback, useEffect, useState } from "react";
import { StaleClientOverlay } from "@/components/StaleClientOverlay";
import {
  isStaleClientError,
  isTransientNetworkError,
  reloadPageForFreshClient
} from "@/lib/client/staleClientErrors";

const BUILD_CHECK_INTERVAL_MS = 5 * 60 * 1000;

type Props = {
  initialBuildId: string;
};

export function DeploymentRefreshGuard({ initialBuildId }: Props) {
  const [visible, setVisible] = useState(false);

  const showRefreshNotice = useCallback(() => {
    setVisible(true);
  }, []);

  const checkBuildId = useCallback(async () => {
    try {
      const response = await fetch("/api/app-version", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { buildId?: string };
      if (data.buildId && data.buildId !== initialBuildId) {
        showRefreshNotice();
      }
    } catch {
      // Ignore transient network errors during background checks.
    }
  }, [initialBuildId, showRefreshNotice]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      // Analytics / third-party scripts must never block registration or browsing.
      if (isTransientNetworkError(event.message, event.filename)) {
        return;
      }

      if (isStaleClientError(event.message, event.filename)) {
        showRefreshNotice();
      }
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      const stack = reason instanceof Error ? reason.stack : undefined;

      if (isTransientNetworkError(message, stack)) {
        return;
      }

      if (isStaleClientError(message, stack)) {
        showRefreshNotice();
      }
    }

    function handleVisible() {
      if (document.visibilityState === "visible") {
        void checkBuildId();
      }
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    document.addEventListener("visibilitychange", handleVisible);

    const intervalId = window.setInterval(() => {
      void checkBuildId();
    }, BUILD_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      document.removeEventListener("visibilitychange", handleVisible);
      window.clearInterval(intervalId);
    };
  }, [checkBuildId, showRefreshNotice]);

  if (!visible) {
    return null;
  }

  return <StaleClientOverlay onRefresh={reloadPageForFreshClient} />;
}
