"use client";

import { useEffect } from "react";
import { isTransientNetworkError } from "@/lib/client/staleClientErrors";

declare global {
  interface Window {
    __mcBenignNetworkGuard?: boolean;
  }
}

function installBenignNetworkGuard() {
  if (typeof window === "undefined" || window.__mcBenignNetworkGuard) {
    return;
  }

  window.__mcBenignNetworkGuard = true;

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const messages = args.map((arg) => {
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ""}`;
      return String(arg ?? "");
    });

    if (messages.some((message) => isTransientNetworkError(message, message))) {
      return;
    }

    originalError(...args);
  };

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      const stack = reason instanceof Error ? reason.stack : undefined;

      if (isTransientNetworkError(message, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    "error",
    (event) => {
      if (isTransientNetworkError(event.message, event.filename)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

installBenignNetworkGuard();

/** Silences third-party network noise (VK tracker, Metrika) before it hits Next overlay. */
export function BenignNetworkErrorGuard() {
  useEffect(() => {
    installBenignNetworkGuard();
  }, []);

  return null;
}
