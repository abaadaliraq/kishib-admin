import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import StatCard from "@/components/StatCard";
import {
  activitySummary,
  cleanValue,
  fetchEvaluationsForAdmin,
  fetchProfilesForAdmin,
  fetchUserActivityForAdmin,
  formatDate,
  profileMapById,
} from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type LiveUserRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  current_page: string | null;
  platform: string | null;
  app_version: string | null;
  last_seen_at: string | null;
  evaluations_count: number;
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

function isWithinLastMinutes(value: string | null, minutes: number) {
  if (!value) return false;
  const seen = new Date(value).getTime();
  return Number.isFinite(seen) && Date.now() - seen <= minutes * 60 * 1000;
}

async function fetchLiveUsers() {
  const activity = await fetchUserActivityForAdmin();

  if (!activity.available) {
    return { available: false, rows: [], summary: activitySummary([]) };
  }

  const recentRows = activity.rows.filter((row) => isWithinLastMinutes(row.last_seen_at, 30));
  const userIds = activity.rows.map((row) => row.user_id);
  const profilesById = profileMapById(await fetchProfilesForAdmin(userIds));
  const evaluations = await fetchEvaluationsForAdmin(2000);
  const evaluationCounts = new Map<string, number>();

  evaluations.forEach((evaluation) => {
    if (!evaluation.user_id) return;
    evaluationCounts.set(evaluation.user_id, (evaluationCounts.get(evaluation.user_id) ?? 0) + 1);
  });

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authById = new Map((data.users ?? []).map((user) => [user.id, user]));
  const rows: LiveUserRow[] = recentRows.map((activityRow) => {
    const profile = profilesById.get(activityRow.user_id);
    const authUser = authById.get(activityRow.user_id);
    const metadata = authUser?.user_metadata ?? {};

    return {
      user_id: activityRow.user_id,
      name:
        profile?.full_name ??
        (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
        (typeof metadata.name === "string" ? metadata.name : null),
      email: profile?.email ?? authUser?.email ?? null,
      phone: profile?.phone ?? (typeof metadata.phone === "string" ? metadata.phone : null),
      country: cleanValue(profile?.country),
      province: cleanValue(profile?.province),
      city: cleanValue(profile?.city),
      current_page: activityRow.current_page,
      platform: activityRow.platform,
      app_version: activityRow.app_version,
      last_seen_at: activityRow.last_seen_at,
      evaluations_count: evaluationCounts.get(activityRow.user_id) ?? 0,
    };
  });

  return { available: true, rows, summary: activitySummary(activity.rows) };
}

export default async function LiveUsersPage() {
  const admin = await requireAdmin();
  const { available, rows, summary } = await fetchLiveUsers();
  const showSensitive = canViewSensitive(admin.role);

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Live Activity</p>
          <h1 className="text-3xl font-semibold text-white">Live Users</h1>
          <p className="max-w-2xl text-slate-400">
            Broad app activity based on last_seen_at. No GPS or precise location is collected here.
          </p>
        </header>

        {!available ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">User activity tracking is not enabled yet.</p>
            <p className="mt-2 text-sm text-slate-400">Create the optional user_activity table from README to enable live activity.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active Now" value={summary.activeNow} />
              <StatCard label="Active Last 30 Minutes" value={summary.activeLast30Minutes} />
              <StatCard label="Active Today" value={summary.activeToday} />
              <StatCard label="Inactive 7 Days" value={summary.inactive7Days} />
            </div>

            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
                <p className="text-lg font-semibold text-white">No users active in the last 30 minutes</p>
                <p className="mt-2 text-sm text-slate-400">Recent active users will appear here once activity is tracked.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950">
                <table className="min-w-[1450px] border-separate border-spacing-0 text-left text-sm text-slate-300">
                  <thead className="bg-zinc-900 text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Name</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Phone</th>
                      <th className="px-4 py-4">Country</th>
                      <th className="px-4 py-4">Province</th>
                      <th className="px-4 py-4">City</th>
                      <th className="px-4 py-4">Current Page</th>
                      <th className="px-4 py-4">Platform</th>
                      <th className="px-4 py-4">App Version</th>
                      <th className="px-4 py-4">Last Seen</th>
                      <th className="px-4 py-4">Evaluations</th>
                      <th className="px-4 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.user_id} className="border-t border-white/5">
                        <td className="px-4 py-4 text-white">{row.name ?? "-"}</td>
                        <td className="px-4 py-4">{maskEmail(row.email, showSensitive)}</td>
                        <td className="px-4 py-4">{maskPhone(row.phone, showSensitive)}</td>
                        <td className="px-4 py-4">{row.country ?? "-"}</td>
                        <td className="px-4 py-4">{row.province ?? "-"}</td>
                        <td className="px-4 py-4">{row.city ?? "-"}</td>
                        <td className="max-w-[240px] break-all px-4 py-4 text-slate-400">{row.current_page ?? "-"}</td>
                        <td className="px-4 py-4">{row.platform ?? "-"}</td>
                        <td className="px-4 py-4">{row.app_version ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-400">{formatDate(row.last_seen_at)}</td>
                        <td className="px-4 py-4 text-amber-200">{row.evaluations_count}</td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/users?country=${encodeURIComponent(row.country ?? "")}`}
                            className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100"
                          >
                            View User
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
