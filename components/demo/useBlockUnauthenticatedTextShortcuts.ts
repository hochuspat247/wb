"use client";

import { useEffect } from "react";

export function useBlockUnauthenticatedTextShortcuts(isAuthenticated: boolean) {
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const blocked = isCtrlOrCmd && ["a", "c", "x", "s", "p", "u"].includes(key);

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const handleSelectStart = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("selectstart", handleSelectStart, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
    };
  }, [isAuthenticated]);
}
