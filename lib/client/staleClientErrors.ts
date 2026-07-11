const STALE_CLIENT_PATTERNS = [
  /loading chunk [\da-z-]+ failed/i,
  /loading css chunk [\da-z-]+ failed/i,
  /chunkloaderror/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /failed to load.*\/_next\/static\//i,
  /\/_next\/static\/chunks\//i,
  /is not a valid javascript mime type/i
];

export const STALE_CLIENT_TITLE = "Обновите страницу";
export const STALE_CLIENT_DESCRIPTION =
  "Похоже, у вас проблемы с интернетом — или сайт только что обновился. Нажмите «Обновить», ваши данные сохранены.";

export function isStaleClientError(message?: string | null, source?: string | null) {
  const haystack = `${message ?? ""} ${source ?? ""}`.trim();

  if (!haystack) {
    return false;
  }

  return STALE_CLIENT_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function reloadPageForFreshClient() {
  window.location.reload();
}
