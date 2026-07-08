import { trackAnalyticsEvent } from "@/lib/server/analytics";

type DemoErrorLogInput = {
  message: string;
  guestId?: string;
  userId?: string | null;
  path?: string;
  code?: string;
  status?: number;
  source?: "server" | "client";
};

export async function logDemoGenerationError(input: DemoErrorLogInput) {
  const sessionId = (input.guestId || input.userId || "server").slice(0, 80);

  await trackAnalyticsEvent({
    eventType: "conversion",
    eventName: "demo_generation_error",
    path: (input.path || "/api/generations/demo").slice(0, 300),
    sessionId,
    userId: input.userId || undefined,
    metadata: {
      message: input.message.slice(0, 500),
      code: input.code || "DEMO_FAILED",
      status: input.status || 500,
      source: input.source || "server",
      ...(input.guestId ? { guestId: input.guestId } : {})
    }
  });
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "Неизвестная ошибка");
}
