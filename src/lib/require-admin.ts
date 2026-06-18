import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminSession = {
  userId: string;
  email: string | null;
  role: string;
};

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !adminUser) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: adminUser.role,
  };
}
