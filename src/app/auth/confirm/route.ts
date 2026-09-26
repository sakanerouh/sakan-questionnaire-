import { NextResponse } from "next/server";
import { isAppLocale } from "@/i18n/routing";
import { createSupabaseAuthServerClient } from "@/lib/supabase/authServer";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const requestedLocale = next?.split("/").filter(Boolean)[0];
  const locale = isAppLocale(requestedLocale) ? requestedLocale : "en";
  const safeNext = `/${locale}/admin`;
  const authClient = await createSupabaseAuthServerClient();
  const serviceClient = getSupabaseAdmin();

  if ((!tokenHash && !code) || !authClient || !serviceClient) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=configuration`, url.origin));
  }

  const { data, error } = tokenHash
    ? await authClient.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
    : await authClient.auth.exchangeCodeForSession(code!);
  const userId = data.user?.id;
  if (error || !userId) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=expired`, url.origin));
  }

  const { data: admin } = await serviceClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (!admin) {
    await authClient.auth.signOut();
    return NextResponse.redirect(new URL(`/${locale}/admin/login?error=unauthorized`, url.origin));
  }

  await serviceClient.from("admin_audit_log").insert({
    actor_user_id: userId,
    action: "admin.login",
    entity_type: "admin_session",
    entity_id: userId,
    metadata: {},
  });

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
