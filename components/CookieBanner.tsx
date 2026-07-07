"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const COOKIE_ACCEPTED_KEY = "marketcard_cookie_accepted";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(COOKIE_ACCEPTED_KEY) !== "true");
  }, []);

  function close() {
    window.localStorage.setItem(COOKIE_ACCEPTED_KEY, "true");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-4xl rounded-[18px] border border-clay bg-card/95 p-4 shadow-soft backdrop-blur-xl md:bottom-6 md:flex md:items-center md:gap-4">
      <p className="pr-8 text-sm font-semibold leading-relaxed text-ink md:pr-0">
        Мы используем файлы cookie для улучшения работы сайта и анализа трафика. Продолжая использовать сайт, вы соглашаетесь с
        использованием cookie.
      </p>
      <div className="mt-3 flex shrink-0 items-center gap-2 md:mt-0">
        <Button onClick={close} size="sm" type="button">
          Хорошо
        </Button>
        <button
          aria-label="Закрыть cookie-баннер"
          className="grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:border-accent/30 hover:text-ink"
          onClick={close}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
