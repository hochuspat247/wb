import { NextResponse } from "next/server";
import type { ContentPolicyBlock } from "@/lib/ai/contentPolicy";

export function createContentPolicyBlockedResponse(result: ContentPolicyBlock) {
  return NextResponse.json(
    {
      error: result.error,
      code: result.code,
      category: result.category,
      source: result.source,
      matches: result.matches
    },
    { status: 422 }
  );
}
