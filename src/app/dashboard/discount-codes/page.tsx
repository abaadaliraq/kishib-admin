import AdminShell from "@/components/AdminShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

async function fetchDiscountCodes() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("discount_codes")
      .select("id, code, percentage, plan_type, max_uses, used_count, expires_at, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { discountCodes: [], error: error.message };
    }

    return { discountCodes: data ?? [], error: null };
  } catch (error) {
    return {
      discountCodes: [],
      error: error instanceof Error ? error.message : "Unable to load discount codes.",
    };
  }
}

export default async function DiscountCodesPage() {
  await requireAdmin();
  const { discountCodes, error } = await fetchDiscountCodes();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Discount Codes</p>
          <h1 className="text-3xl font-semibold text-white">Promo Codes</h1>
          <p className="max-w-2xl text-slate-400">Create and monitor active discount codes for plans.</p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            {error ? (
              <div className="p-8 text-slate-300">
                <p className="text-lg font-semibold text-white">No discount codes table found</p>
                <p className="mt-2 text-sm text-slate-400">The discount_codes table is unavailable or an error occurred.</p>
              </div>
            ) : discountCodes.length === 0 ? (
              <div className="p-8 text-slate-300">
                <p className="text-lg font-semibold text-white">No discount codes yet</p>
                <p className="mt-2 text-sm text-slate-400">Create a promo code using the form beside this list.</p>
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
                <thead className="bg-zinc-900 text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Percent</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Uses</th>
                    <th className="px-6 py-4">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {discountCodes.map((discount) => (
                    <tr key={discount.id} className="border-t border-white/5">
                      <td className="px-6 py-4 text-white">{discount.code}</td>
                      <td className="px-6 py-4">{discount.percentage}%</td>
                      <td className="px-6 py-4 text-slate-400">{discount.plan_type ?? "All"}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {discount.used_count ?? 0}/{discount.max_uses ?? "unlimited"}
                      </td>
                      <td className="px-6 py-4 text-amber-200">{discount.is_active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
            <h2 className="text-lg font-semibold text-white">Create a Discount Code</h2>
            <p className="mt-2 text-sm text-slate-400">Submit the form to add a new code.</p>
            <form method="post" action="/api/discount-codes" className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300">Code</label>
                <input
                  name="code"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
                  placeholder="NEWYEAR"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Percentage
                  <input
                    name="percentage"
                    type="number"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
                    min={1}
                    max={100}
                    required
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Max Uses
                  <input
                    name="max_uses"
                    type="number"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
                    min={1}
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-300">
                Plan Type
                <input
                  name="plan_type"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
                  placeholder="monthly"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Expires at
                <input
                  name="expires_at"
                  type="datetime-local"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
                />
              </label>

              <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/10 bg-black text-amber-500" />
                Active
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
              >
                Create Code
              </button>
            </form>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
