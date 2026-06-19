import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import {
  cleanValue,
  fetchEvaluationsForAdmin,
  fetchProfilesForAdmin,
  formatDate,
  profileMapById,
} from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type ActiveFreeUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  evaluations_count: number;
  last_evaluation_at: string | null;
  provider: string | null;
};

function canViewSensitive(role: string) {
  return ["owner", "admin", "manager"].includes(role);
}

function maskEmail(email: string | null, visible: boolean) {
  if (!email || visible) return email ?? "-";
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null, visible: boolean) {
  if (!phone || visible) return phone ?? "-";
  return phone.length > 4 ? `${phone.slice(0, 2)}***${phone.slice(-2)}` : "***";
}

async function fetchActiveSubscriptionUserIds() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    if (error) return new Set<string>();

    return new Set(
      (Array.isArray(data) ? data : [])
        .map((row) => (typeof row.user_id === "string" ? row.user_id : null))
        .filter((id): id is string => Boolean(id)),
    );
  } catch {
    return new Set<string>();
  }
}

async function fetchActiveFreeUsers() {
  const [evaluations, activeSubscribers] = await Promise.all([
    fetchEvaluationsForAdmin(2000),
    fetchActiveSubscriptionUserIds(),
  ]);
  const byUser = new Map<string, { count: number; lastAt: string | null }>();

  evaluations.forEach((evaluation) => {
    const userId = evaluation.user_id;
    if (!userId || activeSubscribers.has(userId)) return;
    const existing = byUser.get(userId);
    byUser.set(userId, {
      count: (existing?.count ?? 0) + 1,
      lastAt: existing?.lastAt ?? evaluation.created_at,
    });
  });

  const userIds = Array.from(byUser.entries())
    .filter(([, stats]) => stats.count >= 3)
    .map(([userId]) => userId);
  const profilesById = profileMapById(await fetchProfilesForAdmin(userIds));
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authById = new Map((data.users ?? []).map((user) => [user.id, user]));

  return userIds
    .map((userId): ActiveFreeUser => {
      const profile = profilesById.get(userId);
      const authUser = authById.get(userId);
      const stats = byUser.get(userId);
      const metadata = authUser?.user_metadata ?? {};

      return {
        id: userId,
        name:
          profile?.full_name ??
          (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
          (typeof metadata.name === "string" ? metadata.name : null),
        email: profile?.email ?? authUser?.email ?? null,
        phone: profile?.phone ?? (typeof metadata.phone === "string" ? metadata.phone : null),
        country: cleanValue(profile?.country),
        evaluations_count: stats?.count ?? 0,
        last_evaluation_at: stats?.lastAt ?? null,
        provider: profile?.provider ?? String(authUser?.app_metadata?.provider ?? "email"),
      };
    })
    .sort((a, b) => b.evaluations_count - a.evaluations_count);
}

export default async function ActiveFreeUsersPage() {
  const admin = await requireAdmin();
  const users = await fetchActiveFreeUsers();
  const showSensitive = canViewSensitive(admin.role);

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Growth</p>
          <h1 className="text-3xl font-semibold text-white">Active Free Users</h1>
          <p className="max-w-2xl text-slate-400">Users with 3 or more evaluations and no active subscription.</p>
        </header>

        {users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No active free users found</p>
            <p className="mt-2 text-sm text-slate-400">This appears when users have 3+ evaluations without an active subscription.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950">
            <table className="min-w-[1100px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Evaluations</th>
                  <th className="px-4 py-4">Last Evaluation</th>
                  <th className="px-4 py-4">Provider</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="px-4 py-4 text-white">{user.name ?? "-"}</td>
                    <td className="px-4 py-4">{maskEmail(user.email, showSensitive)}</td>
                    <td className="px-4 py-4">{maskPhone(user.phone, showSensitive)}</td>
                    <td className="px-4 py-4">{user.country ?? "-"}</td>
                    <td className="px-4 py-4 text-amber-200">{user.evaluations_count}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.last_evaluation_at)}</td>
                    <td className="px-4 py-4">{user.provider ?? "-"}</td>
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/users?country=${encodeURIComponent(user.country ?? "")}`} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100">
                        View User
                      </Link>
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
