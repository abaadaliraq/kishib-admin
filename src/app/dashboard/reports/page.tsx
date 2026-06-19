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
  type EvaluationAdminRow,
} from "@/lib/admin-dashboard-data";
import { getCloudinaryImageUrl } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type ReportFilters = {
  country: string;
  province: string;
  gender: string;
  language: string;
};

type EvaluationViewRow = EvaluationAdminRow & {
  gender: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  language: string | null;
};

const genderOptions = [
  { value: "", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getEvaluationTitle(evaluation: EvaluationViewRow) {
  return evaluation.title || evaluation.item_type || "Untitled item";
}

function getEvaluationImage(evaluation: EvaluationViewRow) {
  return (
    getCloudinaryImageUrl(evaluation.image_url) ||
    getCloudinaryImageUrl(evaluation.cloudinary_public_id)
  );
}

function matchesFilters(evaluation: EvaluationViewRow, filters: ReportFilters) {
  if (filters.country && cleanValue(evaluation.country) !== filters.country) return false;
  if (filters.province && cleanValue(evaluation.province) !== filters.province) return false;
  if (filters.gender && cleanValue(evaluation.gender) !== filters.gender) return false;
  if (filters.language && cleanValue(evaluation.language) !== filters.language) return false;
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

function shortId(id: string | null) {
  return id ? id.slice(0, 8) : "-";
}

async function fetchEvaluationRows(filters: ReportFilters) {
  const evaluations = await fetchEvaluationsForAdmin(500);
  const userIds = evaluations.map((evaluation) => evaluation.user_id).filter((id): id is string => Boolean(id));
  const profiles = await fetchProfilesForAdmin(userIds);
  const profilesById = profileMapById(profiles);

  const allEvaluations: EvaluationViewRow[] = evaluations.map((evaluation) => {
    const profile = evaluation.user_id ? profilesById.get(evaluation.user_id) : null;

    return {
      ...evaluation,
      gender: profile?.gender ?? null,
      country: cleanValue(evaluation.user_country) || profile?.country || null,
      province: cleanValue(evaluation.user_province) || profile?.province || null,
      city: cleanValue(evaluation.user_city) || profile?.city || null,
      language: profile ? getLanguageLabel(profile) || evaluation.locale : evaluation.locale,
    };
  });

  return {
    evaluations: allEvaluations.filter((evaluation) => matchesFilters(evaluation, filters)),
    allEvaluations,
  };
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

export default async function DashboardReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const filters: ReportFilters = {
    country: firstParam(params.country),
    province: firstParam(params.province),
    gender: firstParam(params.gender),
    language: firstParam(params.language),
  };
  const { evaluations, allEvaluations } = await fetchEvaluationRows(filters);
  const visibleEvaluations = evaluations.slice(0, 25);
  const showSensitive = canViewSensitive(admin.role);
  const countryOptions = [
    { value: "", label: "All countries" },
    ...aggregateValues(allEvaluations.map((evaluation) => evaluation.country), 100).map((item) => ({
      value: item.label,
      label: item.label,
    })),
  ];
  const provinceOptions = [
    { value: "", label: "All provinces" },
    ...aggregateValues(allEvaluations.map((evaluation) => evaluation.province), 100).map((item) => ({
      value: item.label,
      label: item.label,
    })),
  ];
  const languageOptions = [
    { value: "", label: "All languages" },
    ...aggregateValues(allEvaluations.map((evaluation) => evaluation.language), 100).map((item) => ({
      value: item.label,
      label: item.label,
    })),
  ];

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Reports</p>
          <h1 className="text-3xl font-semibold text-white">User Evaluations</h1>
          <p className="max-w-2xl text-slate-400">Evaluation history with broad profile demographics. No GPS or precise location is collected here.</p>
        </header>

        <form className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-4 md:grid-cols-5" action="/dashboard/reports">
          <FilterSelect label="Country" name="country" value={filters.country} options={countryOptions} />
          <FilterSelect label="Province" name="province" value={filters.province} options={provinceOptions} />
          <FilterSelect label="Gender" name="gender" value={filters.gender} options={genderOptions} />
          <FilterSelect label="Language" name="language" value={filters.language} options={languageOptions} />
          <div className="flex items-end gap-3">
            <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400">
              Apply
            </button>
            <Link href="/dashboard/reports" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5">
              Reset
            </Link>
          </div>
        </form>

        {evaluations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No matching evaluations</p>
            <p className="mt-2 text-sm text-slate-400">Try clearing filters or adding demographic profile fields.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            <div className="border-b border-white/10 px-4 py-3 text-sm text-slate-400">
              Showing {visibleEvaluations.length} of {evaluations.length} evaluations
            </div>
            <table className="min-w-[1080px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="sticky top-0 z-10 bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Image</th>
                  <th className="px-4 py-4">Type / Item</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Gender</th>
                  <th className="px-4 py-4">Language</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvaluations.map((evaluation) => {
                  const imageUrl = getEvaluationImage(evaluation);

                  return (
                    <tr key={evaluation.id} className="border-t border-white/5 align-top transition hover:bg-white/[0.03]">
                      <td className="px-4 py-4">
                        {imageUrl ? (
                          <a href={imageUrl} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={getEvaluationTitle(evaluation)} className="h-full w-full object-cover" loading="lazy" />
                          </a>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[220px] truncate font-medium text-white">{getEvaluationTitle(evaluation)}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">#{shortId(evaluation.id)}</p>
                        <span className="mt-2 inline-flex rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
                          {evaluation.item_type || "Unknown type"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white">{evaluation.user_name || "-"}</td>
                      <td className="px-4 py-4">{maskEmail(evaluation.user_email, showSensitive)}</td>
                      <td className="px-4 py-4">
                        <p>{evaluation.country || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[evaluation.province, evaluation.city].filter(Boolean).join(" / ") || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4">{evaluation.gender || "-"}</td>
                      <td className="px-4 py-4">{evaluation.language || "-"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(evaluation.created_at)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/reports/${evaluation.id}`} className="inline-flex rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/15">
                          View
                        </Link>
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
