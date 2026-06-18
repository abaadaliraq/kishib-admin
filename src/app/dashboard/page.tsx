import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import StatCard from "@/components/StatCard";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
  const [
    totalUsers,
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

  return {
    totalUsers,
    totalEvaluations,
    monthlySubscribers,
    yearlySubscribers,
    singleReportPurchases,
    evaluationsWithImages,
    failedAnalyses,
  };
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
            <StatCard label="Total Evaluations" value={stats.totalEvaluations} />
          </Link>
          <Link href="/dashboard/subscriptions">
            <StatCard label="Monthly Subscribers" value={stats.monthlySubscribers} />
          </Link>
          <Link href="/dashboard/subscriptions">
            <StatCard label="Yearly Subscribers" value={stats.yearlySubscribers} />
          </Link>
          <Link href="/dashboard/reports">
            <StatCard label="Single Report Purchases" value={stats.singleReportPurchases} />
          </Link>
          <Link href="/dashboard/reports">
            <StatCard label="Evaluations With Images" value={stats.evaluationsWithImages} />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
