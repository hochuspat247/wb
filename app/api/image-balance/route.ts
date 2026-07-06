import { NextResponse } from "next/server";
import { checkNanoBananaExpertBalance } from "@/lib/ai/nanobananaExpert";

export const runtime = "nodejs";

export async function GET() {
  const result = await checkNanoBananaExpertBalance();

  if (!result.ok) {
    return NextResponse.json({
      bananas: null,
      generation_coupons: null,
      provider: "NanoBanana Expert",
      error: result.error
    });
  }

  return NextResponse.json({
    bananas: result.data.bananas,
    generation_coupons: result.data.generation_coupons,
    provider: "NanoBanana Expert"
  });
}
