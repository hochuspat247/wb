const STALE_CLIENT_PATTERNS = [
  /loading chunk [\da-z-]+ failed/i,
  /loading css chunk [\da-z-]+ failed/i,
  /chunkloaderror/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /failed to load.*\/_next\/static\//i,
  /is not a valid javascript mime type/i
];

/** Transient network errors that must never block the UI (e.g. analytics). */
const TRANSIENT_NETWORK_PATTERNS = [
  /^failed to fetch$/i,
  /^typeerror:\s*failed to fetch$/i,
  /^networkerror/i,
  /^load failed$/i,
  /network request failed/i,
  /the internet connection appears to be offline/i,
  /gettrackerid/i,
  /mc\.yandex\.(ru|com)/i,
  /metrika\/tag\.js/i
];

export const STALE_CLIENT_TITLE = "Обновите страницу";
export const STALE_CLIENT_DESCRIPTION =
  "Похоже, у вас проблемы с интернетом — или сайт только что обновился. Нажмите «Обновить», ваши данные сохранены.";

export function isTransientNetworkError(message?: string | null, source?: string | null) {
  const haystack = `${message ?? ""} ${source ?? ""}`.trim();
  if (!haystack) return false;

  const messageOnly = (message ?? "").trim();
  if (TRANSIENT_NETWORK_PATTERNS.some((pattern) => pattern.test(messageOnly))) {
    return true;
  }

  // VK ID / Metrika SDK stack markers with a transient network failure.
  if (
    /gettrackerid|mc\.yandex|metrika|stat_events_vkid_sdk|vkid_sdk_get_config|id\.vk\.(ru|com)/i.test(haystack) &&
    /failed to fetch|networkerror|load failed/i.test(haystack)
  ) {
    return true;
  }

  // Bare "Failed to fetch" buried in a Next.js stack must not count as a stale client.
  if (/failed to fetch/i.test(messageOnly) && !/dynamically imported module/i.test(haystack)) {
    return true;
  }

  return false;
}

export function isStaleClientError(message?: string | null, source?: string | null) {
  const haystack = `${message ?? ""} ${source ?? ""}`.trim();

  if (!haystack) {
    return false;
  }

  if (isTransientNetworkError(message, source)) {
    return false;
  }

  return STALE_CLIENT_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function reloadPageForFreshClient() {
  window.location.reload();
}
