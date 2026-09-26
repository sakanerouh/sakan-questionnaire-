import "server-only";

import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createSupabaseAuthServerClient } from "@/lib/supabase/authServer";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CurrentAdmin = {
  userId: string;
  email: string;
  displayName: string | null;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const authClient = await createSupabaseAuthServerClient();
  const serviceClient = getSupabaseAdmin();
  if (!authClient || !serviceClient) return null;

  const { data, error } = await authClient.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) return null;

  const { data: admin, error: adminError } = await serviceClient
    .from("admin_users")
    .select("user_id, email, display_name, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !admin) return null;
  return {
    userId: admin.user_id,
    email: admin.email,
    displayName: admin.display_name,
  };
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("ADMIN_UNAUTHORIZED");
  return admin;
}

export async function requireAdminPage(locale: AppLocale): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  return admin;
}

export async function recordAdminAudit(
  admin: CurrentAdmin,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    actor_user_id: admin.userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}

