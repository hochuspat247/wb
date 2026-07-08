"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "marketcard-admin-sections";

function readState() {
  if (typeof window === "undefined") {
    return {} as Record<string, boolean>;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, boolean>;
    }

    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {} as Record<string, boolean>;
  }
}

function writeState(state: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAdminSectionState(id: string, defaultOpen = true) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readState();
    if (Object.prototype.hasOwnProperty.call(stored, id)) {
      setIsOpen(stored[id]);
    }
    setHydrated(true);
  }, [id]);

  function toggle() {
    setIsOpen((current) => {
      const next = !current;
      const stored = readState();
      stored[id] = next;
      writeState(stored);
      return next;
    });
  }

  return {
    isOpen: hydrated ? isOpen : defaultOpen,
    toggle
  };
}
