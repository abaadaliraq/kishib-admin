import AdminShell from "@/components/AdminShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

async function fetchSubscriptions() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_type, status, created_at, expires_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { subscriptions: [], error: error.message };
    }

    return { subscriptions: data ?? [], error: null };
  } catch (error) {
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : "Unable to load subscriptions.",
    };
  }
}

export default async function DashboardSubscriptionsPage() {
  await requireAdmin();
  const { subscriptions, error } = await fetchSubscriptions();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Subscriptions</p>
          <h1 className="text-3xl font-semibold text-white">Active Plans</h1>
          <p className="max-w-2xl text-slate-400">Review subscription records from Supabase.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No subscription table found</p>
            <p className="mt-2 text-sm text-slate-400">The subscriptions table is unavailable or an error occurred.</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No subscriptions yet</p>
            <p className="mt-2 text-sm text-slate-400">Subscription data will appear once available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Started</th>
                  <th className="px-6 py-4">Expires</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-t border-white/5">
                    <td className="px-6 py-5 text-white">{subscription.user_id ?? "-"}</td>
                    <td className="px-6 py-5">{subscription.plan_type ?? "-"}</td>
                    <td className="px-6 py-5 text-amber-200">{subscription.status ?? "-"}</td>
                    <td className="px-6 py-5 text-slate-400">
                      {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-5 text-slate-400">
                      {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
