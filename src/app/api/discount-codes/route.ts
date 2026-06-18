import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const code = formData.get("code")?.toString().trim().toUpperCase();
  const percentage = Number(formData.get("percentage"));
  const maxUses = Number(formData.get("max_uses"));
  const expiresAt = formData.get("expires_at")?.toString() || null;
  const planType = formData.get("plan_type")?.toString().trim() || null;
  const isActive = formData.get("is_active") === "on";

  if (!code || !Number.isInteger(percentage) || percentage < 1 || percentage > 100) {
    return NextResponse.redirect(new URL("/dashboard/discount-codes", request.url));
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("discount_codes").insert([
    {
      code,
      percentage,
      plan_type: planType,
      max_uses: Number.isFinite(maxUses) ? maxUses : null,
      expires_at: expiresAt || null,
      is_active: isActive,
    },
  ]);

  return NextResponse.redirect(new URL("/dashboard/discount-codes", request.url));
}
