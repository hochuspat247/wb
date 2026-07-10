"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { resetFormGuardClock } from "@/lib/security/formGuard";

type AntiBotFieldsProps = {
  honeypot: string;
  onHoneypotChange: (value: string) => void;
  captcha?: ReactNode | null;
};

export function AntiBotFields({ honeypot, onHoneypotChange, captcha }: AntiBotFieldsProps) {
  useEffect(() => {
    resetFormGuardClock();
  }, []);

  return (
    <>
      <input
        aria-hidden
        autoComplete="off"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
        name="company"
        onChange={(event) => onHoneypotChange(event.target.value)}
        tabIndex={-1}
        type="text"
        value={honeypot}
      />
      {captcha}
    </>
  );
}
