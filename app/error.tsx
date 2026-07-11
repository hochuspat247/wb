"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";
import {
  isStaleClientError,
  reloadPageForFreshClient,
  STALE_CLIENT_DESCRIPTION,
  STALE_CLIENT_TITLE
} from "@/lib/client/staleClientErrors";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const staleClient = isStaleClientError(error.message, error.stack);

  return (
    <ErrorFallback
      description={staleClient ? STALE_CLIENT_DESCRIPTION : undefined}
      reset={staleClient ? reloadPageForFreshClient : reset}
      resetLabel={staleClient ? "Обновить страницу" : undefined}
      title={staleClient ? STALE_CLIENT_TITLE : undefined}
    />
  );
}
