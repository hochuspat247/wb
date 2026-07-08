"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";

export default function CabinetError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorFallback
      description="Не удалось открыть кабинет. Обновите страницу или вернитесь к созданию карточки на главной."
      homeHref="/"
      reset={reset}
      title="Кабинет временно недоступен"
    />
  );
}
