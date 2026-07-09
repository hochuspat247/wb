"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "admin-sections";

function storageKey(scope: string) {
  return `${STORAGE_PREFIX}-${scope}`;
}

function readState(scope: string) {
  if (typeof window === "undefined") {
    return {} as Record<string, boolean>;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) {
      return {} as Record<string, boolean>;
    }

    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {} as Record<string, boolean>;
  }
}

function writeState(scope: string, state: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(scope), JSON.stringify(state));
}

export function useAdminSectionState(id: string, defaultOpen = true, scope = "marketcard") {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readState(scope);
    if (Object.prototype.hasOwnProperty.call(stored, id)) {
      setIsOpen(stored[id]);
    }
    setHydrated(true);
  }, [id, scope]);

  function toggle() {
    setIsOpen((current) => {
      const next = !current;
      const stored = readState(scope);
      stored[id] = next;
      writeState(scope, stored);
      return next;
    });
  }

  return {
    isOpen: hydrated ? isOpen : defaultOpen,
    toggle
  };
}
