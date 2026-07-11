import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { RegistrationSource } from "@/lib/auth/registrationMeta";
import { applySignupContext, parseSignupProduct } from "@/lib/server/signupContext";

type SignupContextBody = {
  callbackUrl?: string;
  referrer?: string;
  fromDemo?: boolean;
  source?: RegistrationSource;
  product?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SignupContextBody;

  const result = await applySignupContext(userId, {
    callbackUrl: body.callbackUrl?.trim(),
    referrer: body.referrer?.trim(),
    fromDemo: Boolean(body.fromDemo),
    source: body.source,
    product: parseSignupProduct(body.product)
  });

  return NextResponse.json(result);
}
