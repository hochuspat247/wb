import { NextResponse } from "next/server";
import { buildAdminGptExport, formatAdminGptExportMarkdown } from "@/lib/server/adminGptExport";
import { requireAdminSession } from "@/lib/server/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

function buildFilename(format: "json" | "markdown", exportedAt: string) {
  const date = exportedAt.slice(0, 10);
  return `admin-gpt-export-${date}.${format === "markdown" ? "md" : "json"}`;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "markdown";

  try {
    const payload = await buildAdminGptExport();
    const filename = buildFilename(format, payload.exportedAt);

    if (format === "json") {
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    }

    const markdown = formatAdminGptExportMarkdown(payload);

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("[Admin] GPT export failed", error);
    return NextResponse.json({ error: "Failed to build export" }, { status: 500 });
  }
}
