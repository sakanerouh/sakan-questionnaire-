import { NextResponse } from "next/server";
import { normalizeLocale } from "@/i18n/routing";
import { getCurrentAdmin, recordAdminAudit } from "@/lib/admin/auth";
import { createSupabaseAuthServerClient } from "@/lib/supabase/authServer";
import { requireSameOrigin } from "@/lib/admin/request";

export async function POST(request: Request) {
  const locale = normalizeLocale(new URL(request.url).searchParams.get("locale"));
  try {
    requireSameOrigin(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }
  const admin = await getCurrentAdmin();
  if (admin) await recordAdminAudit(admin, "admin.logout", "admin_session", admin.userId);
  const supabase = await createSupabaseAuthServerClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), 303);
}
