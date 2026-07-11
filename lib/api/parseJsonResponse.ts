export const DEMO_GENERATION_ERROR =
  "Не получилось создать карточку. Попробуйте ещё раз или загрузите другое фото в формате JPG или PNG.";

export const KVARTOVID_GENERATION_ERROR =
  "Не удалось сгенерировать объявление. Попробуйте уменьшить фото или повторить через минуту.";

function getFriendlyHttpError(status: number, fallback: string) {
  if (status === 413) {
    return "Фото слишком большие. Загрузите меньше снимков или уменьшите их размер (JPG/PNG/WebP до 5 МБ каждое).";
  }

  if (status === 408 || status === 504) {
    return "Генерация заняла слишком много времени. Попробуйте ещё раз или загрузите фото меньшего размера.";
  }

  if (status >= 500) {
    return "Сервер временно недоступен. Попробуйте ещё раз через минуту.";
  }

  return fallback;
}

function isJsonContentType(contentType: string) {
  return contentType.includes("application/json") || contentType.includes("+json");
}

export async function parseJsonResponse<T>(response: Response, fallback = DEMO_GENERATION_ERROR): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!isJsonContentType(contentType)) {
    throw new Error(getFriendlyHttpError(response.status, fallback));
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(getFriendlyHttpError(response.status, fallback));
  }
}

export function toUserFacingError(error: unknown, fallback = DEMO_GENERATION_ERROR) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (/unexpected token|is not valid json|failed to fetch|networkerror|load failed/i.test(message)) {
    return fallback;
  }

  return message;
}
