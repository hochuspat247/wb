import { callGigaChatJson } from "@/lib/ai/gigachat";
import { extractJsonObject } from "@/lib/json";
import { buildKvartovidFloorPlanPrompt } from "@/lib/kvartovid/floorPlanPrompt";
import { normalizeFloorPlanLayout, renderFloorPlanSvg } from "@/lib/kvartovid/floorPlanRender";
import type { KvartovidFloorPlanLayout, KvartovidListingInput } from "@/types/kvartovid";

type RawFloorPlanResponse = {
  width?: number;
  height?: number;
  rooms?: Array<{
    name?: string;
    area?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>;
};

export async function generateKvartovidFloorPlan(input: KvartovidListingInput) {
  try {
    const prompt = buildKvartovidFloorPlanPrompt(input);
    const rawText = await callGigaChatJson(prompt, { temperature: 0.25, maxTokens: 2000 });
    const parsed = JSON.parse(extractJsonObject(rawText)) as RawFloorPlanResponse;
    const layout = normalizeFloorPlanLayout(parsed as Partial<KvartovidFloorPlanLayout>, input);
    const svg = renderFloorPlanSvg(layout);

    return { layout, svg };
  } catch (error) {
    const layout = normalizeFloorPlanLayout(null, input);
    const svg = renderFloorPlanSvg(layout);

    return {
      layout,
      svg,
      error: error instanceof Error ? error.message : "Использована типовая схема планировки."
    };
  }
}

export type KvartovidFloorPlanResult = {
  layout: KvartovidFloorPlanLayout;
  svg: string;
  error?: string;
};
