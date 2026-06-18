import AdminShell from "@/components/AdminShell";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  provider: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  provider: string | null;
  role: string | null;
  email_confirmed_at: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  evaluations_count: number;
  last_evaluation_at: string | null;
};

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

async function fetchUsers() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      return { users: [], error: error.message };
    }

    const authUsers = data.users ?? [];
    const userIds = authUsers.map((user) => user.id);
    const profilesById = new Map<string, ProfileRow>();
    const evaluationsByUser = new Map<string, { count: number; lastAt: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,phone,country,city,province,provider,created_at,updated_at")
        .in("id", userIds);

      ((profiles ?? []) as ProfileRow[]).forEach((profile) => {
        profilesById.set(profile.id, profile);
      });

      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("user_id,created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      (evaluations ?? []).forEach((evaluation) => {
        const userId = evaluation.user_id;
        if (!userId) return;

        const existing = evaluationsByUser.get(userId);
        evaluationsByUser.set(userId, {
          count: (existing?.count ?? 0) + 1,
          lastAt: existing?.lastAt ?? evaluation.created_at ?? null,
        });
      });
    }

    const users: AdminUserRow[] = authUsers.map((user) => {
      const metadata = user.user_metadata ?? {};
      const profile = profilesById.get(user.id);
      const evaluationStats = evaluationsByUser.get(user.id);

      return {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        full_name:
          profile?.full_name ??
          readMetadataText(metadata, ["full_name", "name", "display_name"]),
        phone: profile?.phone ?? readMetadataText(metadata, ["phone", "phone_number", "mobile"]),
        country: profile?.country ?? readMetadataText(metadata, ["country", "country_name"]),
        city: profile?.city ?? readMetadataText(metadata, ["city"]),
        province: profile?.province ?? readMetadataText(metadata, ["province", "governorate"]),
        provider: profile?.provider ?? String(user.app_metadata?.provider ?? "email"),
        role: typeof user.role === "string" ? user.role : null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        evaluations_count: evaluationStats?.count ?? 0,
        last_evaluation_at: evaluationStats?.lastAt ?? null,
      };
    });

    return { users, error: null };
  } catch (error) {
    return {
      users: [],
      error: error instanceof Error ? error.message : "Unable to load users.",
    };
  }
}

export default async function DashboardUsersPage() {
  await requireAdmin();
  const { users, error } = await fetchUsers();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Users</p>
          <h1 className="text-3xl font-semibold text-white">Application Users</h1>
          <p className="max-w-2xl text-slate-400">Supabase Auth users with profile, location, phone, and evaluation counts.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Unable to load users</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No users yet</p>
            <p className="mt-2 text-sm text-slate-400">Users from Supabase Auth will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            <table className="min-w-[1500px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">User ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Province</th>
                  <th className="px-4 py-4">City</th>
                  <th className="px-4 py-4">Provider</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Evaluations</th>
                  <th className="px-4 py-4">Last Evaluation</th>
                  <th className="px-4 py-4">Joined</th>
                  <th className="px-4 py-4">Last Sign In</th>
                  <th className="px-4 py-4">Email Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-white/5 align-top">
                    <td className="max-w-[220px] break-all px-4 py-4 font-mono text-xs text-slate-500">{user.id}</td>
                    <td className="px-4 py-4 text-white">{user.full_name ?? "-"}</td>
                    <td className="px-4 py-4">{user.email ?? "-"}</td>
                    <td className="px-4 py-4">{user.phone ?? "-"}</td>
                    <td className="px-4 py-4">{user.country ?? "-"}</td>
                    <td className="px-4 py-4">{user.province ?? "-"}</td>
                    <td className="px-4 py-4">{user.city ?? "-"}</td>
                    <td className="px-4 py-4">{user.provider ?? "-"}</td>
                    <td className="px-4 py-4">{user.role ?? "-"}</td>
                    <td className="px-4 py-4 text-amber-200">{user.evaluations_count}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.last_evaluation_at)}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.last_sign_in_at)}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.email_confirmed_at)}</td>
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
