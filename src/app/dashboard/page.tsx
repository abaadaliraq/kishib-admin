import AdminShell from "@/components/AdminShell";
import DashboardOverviewClient from "@/components/DashboardOverviewClient";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  aggregateValues,
  activitySummary,
  fetchEvaluationsForAdmin,
  fetchProfilesForAdmin,
  fetchUserActivityForAdmin,
  getLanguageLabel,
  profileMapById,
  type CountBucket,
} from "@/lib/admin-dashboard-data";

export const dynamic = "force-dynamic";

async function safeCount(table: string) {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countMonthlySubscribers() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan_type", "monthly")
      .eq("status", "active");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countYearlySubscribers() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan_type", "yearly")
      .eq("status", "active");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countSingleReportPurchases() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("type", "single_report")
      .eq("status", "paid");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countEvaluations() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("evaluations")
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countEvaluationsWithImages() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("evaluations")
      .select("*", { count: "exact", head: true })
      .or("image_url.not.is.null,cloudinary_public_id.not.is.null");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countFailedAnalyses() {
  try {
    const supabaseAdmin = createAdminSupabaseClient();
    const { count, error } = await supabaseAdmin
      .from("analysis_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchDashboardStats() {
  const [profiles, evaluations, activity] = await Promise.all([
    fetchProfilesForAdmin(),
    fetchEvaluationsForAdmin(1000),
    fetchUserActivityForAdmin(),
  ]);
  const liveActivity = activity.available
    ? activitySummary(activity.rows)
    : { activeNow: 0, activeLast30Minutes: 0, activeToday: 0, inactive7Days: 0 };
  const profilesById = profileMapById(profiles);
  const [
    profileCount,
    totalEvaluations,
    monthlySubscribers,
    yearlySubscribers,
    singleReportPurchases,
    evaluationsWithImages,
    failedAnalyses,
  ] = await Promise.all([
    safeCount("profiles"),
    countEvaluations(),
    countMonthlySubscribers(),
    countYearlySubscribers(),
    countSingleReportPurchases(),
    countEvaluationsWithImages(),
    countFailedAnalyses(),
  ]);
  const usersByGender = aggregateValues(profiles.map((profile) => profile.gender));
  const topCountries = aggregateValues(profiles.map((profile) => profile.country));
  const topProvinces = aggregateValues(profiles.map((profile) => profile.province));
  const topCities = aggregateValues(profiles.map((profile) => profile.city));
  const topAppLanguages = aggregateValues(profiles.map(getLanguageLabel));
  const evaluationsByCountry = aggregateValues(
    evaluations.map((evaluation) => {
      const profile = evaluation.user_id ? profilesById.get(evaluation.user_id) : null;
      return evaluation.user_country || profile?.country;
    }),
  );
  const evaluationsLast7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count: 0,
    };
  });
  const byDate = new Map(evaluationsLast7Days.map((item) => [item.key, item]));

  evaluations.forEach((evaluation) => {
    if (!evaluation.created_at) return;
    const key = new Date(evaluation.created_at).toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.count += 1;
  });
  const providerBreakdown = aggregateValues(profiles.map((profile) => profile.provider), 6);

  return {
    totalUsers: profileCount || profiles.length,
    totalEvaluations,
    monthlySubscribers,
    yearlySubscribers,
    singleReportPurchases,
    evaluationsWithImages,
    failedAnalyses,
    activeNow: liveActivity.activeNow,
    activeLast30Minutes: liveActivity.activeLast30Minutes,
    usersByGender,
    topCountries,
    topProvinces,
    topCities,
    topAppLanguages,
    evaluationsByCountry,
    evaluationsLast7Days: evaluationsLast7Days.map(({ label, count }) => ({ label, count })),
    providerBreakdown,
  };
}

function AnalyticsList({ title, items }: { title: string; items: CountBucket[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No data available yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <span className="truncate text-sm text-slate-300">{item.label}</span>
              <span className="rounded-lg bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-100">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const stats = await fetchDashboardStats();
  const statCards = [
    { label: "Total Users", value: stats.totalUsers, href: "/dashboard/users" },
    { label: "Active Now", value: stats.activeNow, href: "/dashboard/live-users" },
    { label: "Active Last 30 Minutes", value: stats.activeLast30Minutes, href: "/dashboard/live-users" },
    { label: "Total Evaluations", value: stats.totalEvaluations, href: "/dashboard/reports" },
    { label: "Monthly Subscribers", value: stats.monthlySubscribers, href: "/dashboard/subscriptions" },
    { label: "Yearly Subscribers", value: stats.yearlySubscribers, href: "/dashboard/subscriptions" },
    { label: "Single Report Purchases", value: stats.singleReportPurchases, href: "/dashboard/reports" },
    { label: "Evaluations With Images", value: stats.evaluationsWithImages, href: "/dashboard/reports" },
  ];

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Overview</p>
          <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
          <p className="max-w-2xl text-slate-400">
            A secure summary of users, reports, subscriptions, and discounts.
          </p>
        </header>

        <DashboardOverviewClient
          stats={statCards}
          evaluationsLast7Days={stats.evaluationsLast7Days}
          providerBreakdown={stats.providerBreakdown}
        />

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Audience</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">User Demographics</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnalyticsList title="Users by Gender" items={stats.usersByGender} />
            <AnalyticsList title="Top Countries" items={stats.topCountries} />
            <AnalyticsList title="Top Provinces" items={stats.topProvinces} />
            <AnalyticsList title="Top Cities" items={stats.topCities} />
            <AnalyticsList title="Top App Languages" items={stats.topAppLanguages} />
            <AnalyticsList title="Evaluations by Country" items={stats.evaluationsByCountry} />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
