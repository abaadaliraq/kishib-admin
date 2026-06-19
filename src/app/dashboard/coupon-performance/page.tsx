import AdminShell from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type DiscountCode = {
  id: string;
  code: string;
  percentage: number | null;
  plan_type: string | null;
  used_count: number | null;
  max_uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
};

type CouponStats = {
  conversions: number | null;
  revenue: number | null;
};

function parseCodes(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const row = value as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : null;
      const code = typeof row.code === "string" ? row.code : null;
      if (!id || !code) return null;

      return {
        id,
        code,
        percentage: typeof row.percentage === "number" ? row.percentage : null,
        plan_type: typeof row.plan_type === "string" ? row.plan_type : null,
        used_count: typeof row.used_count === "number" ? row.used_count : null,
        max_uses: typeof row.max_uses === "number" ? row.max_uses : null,
        is_active: typeof row.is_active === "boolean" ? row.is_active : null,
        expires_at: typeof row.expires_at === "string" ? row.expires_at : null,
      };
    })
    .filter((code): code is DiscountCode => Boolean(code));
}

async function fetchDiscountCodes() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("discount_codes")
      .select("id,code,percentage,plan_type,used_count,max_uses,is_active,expires_at")
      .order("created_at", { ascending: false });

    if (error) return [];
    return parseCodes(data);
  } catch {
    return [];
  }
}

async function fetchCouponStats(code: string): Promise<CouponStats> {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("payments")
      .select("amount,total,price,discount_code,coupon_code,status")
      .or(`discount_code.eq.${code},coupon_code.eq.${code}`);

    if (!error && Array.isArray(data)) {
      const paidRows = data.filter((row) => {
        const record = row as Record<string, unknown>;
        return record.status === "paid" || record.status === "succeeded" || record.status === "active";
      });
      const revenue = paidRows.reduce((sum, row) => {
        const record = row as Record<string, unknown>;
        const value = record.amount ?? record.total ?? record.price;
        return sum + (typeof value === "number" ? value : 0);
      }, 0);

      return { conversions: paidRows.length, revenue };
    }
  } catch {
    // Try subscriptions below.
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id,discount_code,coupon_code,status")
      .or(`discount_code.eq.${code},coupon_code.eq.${code}`);

    if (error || !Array.isArray(data)) return { conversions: null, revenue: null };

    return {
      conversions: data.filter((row) => {
        const record = row as Record<string, unknown>;
        return record.status === "active" || record.status === "trialing";
      }).length,
      revenue: null,
    };
  } catch {
    return { conversions: null, revenue: null };
  }
}

export default async function CouponPerformancePage() {
  await requireAdmin();
  const codes = await fetchDiscountCodes();
  const statsEntries = await Promise.all(codes.map(async (code) => [code.code, await fetchCouponStats(code.code)] as const));
  const statsByCode = new Map(statsEntries);

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Revenue</p>
          <h1 className="text-3xl font-semibold text-white">Coupon Performance</h1>
          <p className="max-w-2xl text-slate-400">Discount code usage with optional conversion and revenue signals.</p>
        </header>

        {codes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No discount codes found</p>
            <p className="mt-2 text-sm text-slate-400">Codes from discount_codes will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950">
            <table className="min-w-[1200px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Code</th>
                  <th className="px-4 py-4">Percentage</th>
                  <th className="px-4 py-4">Plan Type</th>
                  <th className="px-4 py-4">Used</th>
                  <th className="px-4 py-4">Max Uses</th>
                  <th className="px-4 py-4">Active</th>
                  <th className="px-4 py-4">Expires</th>
                  <th className="px-4 py-4">Conversions</th>
                  <th className="px-4 py-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const stats = statsByCode.get(code.code);

                  return (
                    <tr key={code.id} className="border-t border-white/5">
                      <td className="px-4 py-4 font-mono text-white">{code.code}</td>
                      <td className="px-4 py-4">{code.percentage ?? "-"}%</td>
                      <td className="px-4 py-4">{code.plan_type ?? "All"}</td>
                      <td className="px-4 py-4 text-amber-200">{code.used_count ?? 0}</td>
                      <td className="px-4 py-4">{code.max_uses ?? "Unlimited"}</td>
                      <td className="px-4 py-4">{code.is_active ? "Yes" : "No"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(code.expires_at)}</td>
                      <td className="px-4 py-4">{stats?.conversions ?? "N/A"}</td>
                      <td className="px-4 py-4">{typeof stats?.revenue === "number" ? stats.revenue : "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
