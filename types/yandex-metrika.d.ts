declare global {
  interface Window {
    ym?: (
      counterId: number,
      methodName: "init" | "hit" | "reachGoal",
      target?: string | Record<string, unknown>,
      params?: Record<string, unknown>
    ) => void;
    _tmr?: Array<{
      id: string;
      type: string;
      start: number;
    }>;
  }
}

export {};
