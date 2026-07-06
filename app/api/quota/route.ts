import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserQuota } from "@/lib/server/quota";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await getUserQuota(userId);
  return NextResponse.json(quota);
}
