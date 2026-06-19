import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import {
  aggregateValues,
  cleanValue,
  fetchEvaluationsForAdmin,
  fetchProfilesForAdmin,
  formatDate,
  getLanguageLabel,
  profileMapById,
  type ProfileAnalyticsRow,
} from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type UserFilters = {
  gender: string;
  country: string;
  province: string;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  language: string | null;
  provider: string | null;
  role: string | null;
  email_confirmed_at: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  evaluations_count: number;
  last_evaluation_at: string | null;
};

const genderOptions = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function matchesFilters(user: AdminUserRow, filters: UserFilters) {
  if (filters.gender !== "all" && cleanValue(user.gender) !== filters.gender) return false;
  if (filters.country && cleanValue(user.country) !== filters.country) return false;
  if (filters.province && cleanValue(user.province) !== filters.province) return false;
  return true;
}

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

async function fetchUsers(filters: UserFilters) {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      return { users: [], allUsers: [], error: error.message };
    }

    const authUsers = data.users ?? [];
    const userIds = authUsers.map((user) => user.id);
    const profiles = await fetchProfilesForAdmin(userIds);
    const profilesById = profileMapById(profiles);
    const evaluations = await fetchEvaluationsForAdmin(1000);
    const evaluationsByUser = new Map<string, { count: number; lastAt: string | null }>();

    evaluations.forEach((evaluation) => {
      const userId = evaluation.user_id;
      if (!userId) return;

      const existing = evaluationsByUser.get(userId);
      evaluationsByUser.set(userId, {
        count: (existing?.count ?? 0) + 1,
        lastAt: existing?.lastAt ?? evaluation.created_at,
      });
    });

    const allUsers: AdminUserRow[] = authUsers.map((user) => {
      const metadata = user.user_metadata ?? {};
      const profile: ProfileAnalyticsRow | undefined = profilesById.get(user.id);
      const evaluationStats = evaluationsByUser.get(user.id);

      return {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        full_name:
          profile?.full_name ??
          readMetadataText(metadata, ["full_name", "name", "display_name"]),
        phone: profile?.phone ?? readMetadataText(metadata, ["phone", "phone_number", "mobile"]),
        gender: profile?.gender ?? readMetadataText(metadata, ["gender"]),
        country: profile?.country ?? readMetadataText(metadata, ["country", "country_name"]),
        province: profile?.province ?? readMetadataText(metadata, ["province", "governorate"]),
        city: profile?.city ?? readMetadataText(metadata, ["city"]),
        language:
          (profile ? getLanguageLabel(profile) : null) ??
          readMetadataText(metadata, ["app_language", "device_locale", "locale", "language"]),
        provider: profile?.provider ?? String(user.app_metadata?.provider ?? "email"),
        role: typeof user.role === "string" ? user.role : null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        evaluations_count: evaluationStats?.count ?? 0,
        last_evaluation_at: evaluationStats?.lastAt ?? null,
      };
    });

    return {
      users: allUsers.filter((user) => matchesFilters(user, filters)),
      allUsers,
      error: null,
    };
  } catch (error) {
    return {
      users: [],
      allUsers: [],
      error: error instanceof Error ? error.message : "Unable to load users.",
    };
  }
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-amber-400/70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function DashboardUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const filters: UserFilters = {
    gender: firstParam(params.gender) || "all",
    country: firstParam(params.country),
    province: firstParam(params.province),
  };
  const { users, allUsers, error } = await fetchUsers(filters);
  const visibleUsers = users.slice(0, 25);
  const showSensitive = canViewSensitive(admin.role);
  const countryOptions = [
    { value: "", label: "All countries" },
    ...aggregateValues(allUsers.map((user) => user.country), 100).map((item) => ({
      value: item.label,
      label: item.label,
    })),
  ];
  const provinceOptions = [
    { value: "", label: "All provinces" },
    ...aggregateValues(allUsers.map((user) => user.province), 100).map((item) => ({
      value: item.label,
      label: item.label,
    })),
  ];

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Users</p>
          <h1 className="text-3xl font-semibold text-white">Application Users</h1>
          <p className="max-w-2xl text-slate-400">Supabase Auth users with profile, location, gender, language, and evaluation counts.</p>
        </header>

        <form className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-4 md:grid-cols-4" action="/dashboard/users">
          <FilterSelect label="Gender" name="gender" value={filters.gender} options={genderOptions} />
          <FilterSelect label="Country" name="country" value={filters.country} options={countryOptions} />
          <FilterSelect label="Province" name="province" value={filters.province} options={provinceOptions} />
          <div className="flex items-end gap-3">
            <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400">
              Apply
            </button>
            <Link href="/dashboard/users" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5">
              Reset
            </Link>
          </div>
        </form>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Unable to load users</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No matching users</p>
            <p className="mt-2 text-sm text-slate-400">Try clearing the filters or adding profile demographic fields.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            <div className="border-b border-white/10 px-4 py-3 text-sm text-slate-400">
              Showing {visibleUsers.length} of {users.length} users
            </div>
            <table className="min-w-[980px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="sticky top-0 z-10 bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Provider</th>
                  <th className="px-4 py-4">Evaluations</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const location = [user.country, user.province, user.city].filter(Boolean).join(" / ");

                  return (
                  <tr key={user.id} className="border-t border-white/5 align-top transition hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-white">{user.full_name ?? "-"}</td>
                    <td className="px-4 py-4">{maskEmail(user.email, showSensitive)}</td>
                    <td className="px-4 py-4">{maskPhone(user.phone, showSensitive)}</td>
                    <td className="px-4 py-4">
                      <p>{location || "-"}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.gender ?? "-"} / {user.language ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">{user.provider ?? "-"}</span>
                    </td>
                    <td className="px-4 py-4 text-amber-200">{user.evaluations_count}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">View</span>
                    </td>
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
