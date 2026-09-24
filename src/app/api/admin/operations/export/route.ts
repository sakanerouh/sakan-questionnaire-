import { NextResponse } from "next/server";
import { localeSchema } from "@/lib/schemas";
import { recordAdminAudit, requireAdmin } from "@/lib/admin/auth";
import { getOperationsData } from "@/lib/admin/operations";
import { operationsToCsv } from "@/lib/admin/operationsExport";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const params = new URL(request.url).searchParams;
    const parsedLocale = localeSchema.safeParse(params.get("locale"));
    const data = await getOperationsData({
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      locale: parsedLocale.success ? parsedLocale.data : "all",
      limit: 5000,
    });
    const csv = operationsToCsv(data.rows);
    await recordAdminAudit(admin, "operations.export", "operations", null, {
      row_count: data.rows.length,
      from: params.get("from"),
      to: params.get("to"),
      locale: params.get("locale") || "all",
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sakan-operations-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    return NextResponse.json(
      { error: message === "ADMIN_UNAUTHORIZED" ? "Unauthorized." : message },
      { status: message === "ADMIN_UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
