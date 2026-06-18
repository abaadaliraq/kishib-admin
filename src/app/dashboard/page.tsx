import AdminShell from "@/components/AdminShell";
import StatCard from "@/components/StatCard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function countAuthUsers() {
  const supabase = createAdminSupabaseClient();
  let totalUsers = 0;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      return 0;
    }

    const users = data.users ?? [];
    totalUsers += users.length;

    if (users.length < 1000) {
      break;
    }
  }

  return totalUsers;
}

async function safeCount(table: string, applyFilters?: (query: ReturnType<ReturnType<typeof createAdminSupabaseClient>["from"]>) => unknown) {
  const supabase = createAdminSupabaseClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  if (applyFilters) {
    query = applyFilters(query) as typeof query;
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function fetchDashboardStats() {
  const stats = {
    totalUsers: 0,
    totalReports: 0,
    monthlySubscribers: 0,
    yearlySubscribers: 0,
    singleReportPurchases: 0,
    failedAnalyses: 0,
  };

  try {
    const [usersCount, reportsCount, monthly, yearly, singles, failed] = await Promise.all([
      countAuthUsers(),
      safeCount("evaluations"),
      safeCount("subscriptions", (query) => query.eq("plan_type", "monthly").in("status", ["active", "trialing"])),
      safeCount("subscriptions", (query) => query.eq("plan_type", "yearly").in("status", ["active", "trialing"])),
      safeCount("evaluations"),
      safeCount("evaluations", (query) => query.or("image_url.not.is.null,cloudinary_public_id.not.is.null")),
    ]);

    stats.totalUsers = usersCount;
    stats.totalReports = reportsCount;
    stats.monthlySubscribers = monthly;
    stats.yearlySubscribers = yearly;
    stats.singleReportPurchases = singles;
    stats.failedAnalyses = failed;
  } catch {
    // keep fallbacks
  }

  return stats;
}

export default async function DashboardPage() {
  await requireAdmin();
  const stats = await fetchDashboardStats();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Overview</p>
          <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
          <p className="max-w-2xl text-slate-400">
            A secure summary of users, reports, subscriptions, and discounts.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Link href="/dashboard/users">
            <StatCard label="Total Users" value={stats.totalUsers} />
          </Link>
          <Link href="/dashboard/reports">
            <StatCard label="Total Evaluations" value={stats.totalReports} />
          </Link>
          <Link href="/dashboard/subscriptions">
            <StatCard label="Monthly Subscribers" value={stats.monthlySubscribers} />
          </Link>
          <Link href="/dashboard/subscriptions">
            <StatCard label="Yearly Subscribers" value={stats.yearlySubscribers} />
          </Link>
          <Link href="/dashboard/reports">
            <StatCard label="Saved Evaluations" value={stats.singleReportPurchases} />
          </Link>
          <Link href="/dashboard/reports">
            <StatCard label="Evaluations With Images" value={stats.failedAnalyses} />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
