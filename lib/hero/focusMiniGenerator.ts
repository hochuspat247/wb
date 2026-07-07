const HIGHLIGHT_CLASS = "hero-upload-highlight";

export function focusHeroMiniGenerator(options?: { openFilePicker?: boolean }) {
  const root = document.getElementById("hero-mini-generator");

  if (root) {
    const rect = root.getBoundingClientRect();
    const inView = rect.top >= 72 && rect.bottom <= window.innerHeight;

    if (!inView) {
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.setTimeout(() => {
    const uploadZone = document.querySelector<HTMLElement>("[data-hero-upload]");
    if (!uploadZone) return;

    uploadZone.focus({ preventScroll: true });
    uploadZone.classList.add(HIGHLIGHT_CLASS);
    window.setTimeout(() => uploadZone.classList.remove(HIGHLIGHT_CLASS), 1800);

    if (options?.openFilePicker) {
      document.querySelector<HTMLInputElement>("#hero-mini-generator input[type='file']")?.click();
    }
  }, root ? 320 : 0);
}
