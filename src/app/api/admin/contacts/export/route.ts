import { NextResponse } from "next/server";
import { recordAdminAudit, requireAdmin } from "@/lib/admin/auth";
import { contactFilterInput, contactFiltersSchema, contactsToCsv } from "@/lib/admin/contacts";
import { getAuditContacts } from "@/lib/admin/contacts.server";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = contactFiltersSchema.safeParse(contactFilterInput(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact filters. Check the dates and try again." }, { status: 400, headers });
    }
    const contacts = await getAuditContacts(parsed.data);
    await recordAdminAudit(admin, "contacts.export", "contacts", null, {
      row_count: contacts.length,
      from: parsed.data.from ?? null,
      to: parsed.data.to ?? null,
      locale: parsed.data.locale,
      status: parsed.data.status,
    });
    return new NextResponse(`\uFEFF${contactsToCsv(contacts)}`, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sakan-contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "ADMIN_UNAUTHORIZED";
    return NextResponse.json({ error: unauthorized ? "Unauthorized." : "Contact export failed. Try again with a narrower date range." }, {
      status: unauthorized ? 401 : 500, headers,
    });
  }
}
