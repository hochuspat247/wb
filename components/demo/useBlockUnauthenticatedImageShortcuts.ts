"use client";

import { useEffect } from "react";

export function useBlockUnauthenticatedImageShortcuts(isAuthenticated: boolean) {
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const blocked = isCtrlOrCmd && ["s", "u", "p", "c"].includes(key);

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isAuthenticated]);
}
