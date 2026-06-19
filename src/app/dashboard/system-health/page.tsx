import AdminShell from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type HealthMetric = {
  label: string;
  value: string | number;
};

async function testSupabaseStatus() {
  const supabase = createAdminSupabaseClient();

  try {
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    return error ? "Degraded" : "Connected";
  } catch {
    return "Unavailable";
  }
}

async function fetchLastReport(status?: string) {
  const supabase = createAdminSupabaseClient();

  try {
    let query = supabase.from("analysis_reports").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(1);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data[0]) {
      const row = data[0] as Record<string, unknown>;
      return {
        title: typeof row.title === "string" ? row.title : typeof row.id === "string" ? row.id : "Report",
        created_at: typeof row.created_at === "string" ? row.created_at : null,
      };
    }
  } catch {
    // Try evaluations below.
  }

  if (status === "failed") return null;

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !Array.isArray(data) || !data[0]) return null;
    const row = data[0] as Record<string, unknown>;

    return {
      title: typeof row.title === "string" ? row.title : typeof row.id === "string" ? row.id : "Evaluation",
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    };
  } catch {
    return null;
  }
}

async function countToday(table: string, status?: string) {
  const supabase = createAdminSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let query = supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    if (status) query = query.eq("status", status);

    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchAiProviderModel() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select("ai_provider,ai_model")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !Array.isArray(data) || !data[0]) return "N/A";
    const row = data[0] as Record<string, unknown>;
    const provider = typeof row.ai_provider === "string" ? row.ai_provider : null;
    const model = typeof row.ai_model === "string" ? row.ai_model : null;
    return [provider, model].filter(Boolean).join(" / ") || "N/A";
  } catch {
    return "N/A";
  }
}

async function fetchPaymentStatus() {
  const supabase = createAdminSupabaseClient();

  try {
    const { count, error } = await supabase.from("payments").select("*", { count: "exact", head: true });
    if (error) return "N/A";
    return `${count ?? 0} payment records`;
  } catch {
    return "N/A";
  }
}

export default async function SystemHealthPage() {
  await requireAdmin();
  const [
    supabaseStatus,
    lastSuccessfulReport,
    lastFailedReport,
    totalReportsToday,
    failedReportsToday,
    aiProviderModel,
    paymentStatus,
  ] = await Promise.all([
    testSupabaseStatus(),
    fetchLastReport(),
    fetchLastReport("failed"),
    countToday("evaluations"),
    countToday("analysis_reports", "failed"),
    fetchAiProviderModel(),
    fetchPaymentStatus(),
  ]);
  const metrics: HealthMetric[] = [
    { label: "Supabase status", value: supabaseStatus },
    { label: "Last successful report", value: lastSuccessfulReport ? `${lastSuccessfulReport.title} - ${formatDate(lastSuccessfulReport.created_at)}` : "N/A" },
    { label: "Last failed report", value: lastFailedReport ? `${lastFailedReport.title} - ${formatDate(lastFailedReport.created_at)}` : "N/A" },
    { label: "Total reports today", value: totalReportsToday },
    { label: "Failed reports today", value: failedReportsToday },
    { label: "AI provider/model", value: aiProviderModel },
    { label: "Payment status", value: paymentStatus },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Operations</p>
          <h1 className="text-3xl font-semibold text-white">System Health</h1>
          <p className="max-w-2xl text-slate-400">Operational signals from Supabase, reports, AI metadata, and payments.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {metrics.map((metric) => (
            <section key={metric.label} className="rounded-lg border border-white/10 bg-zinc-950 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
              <p className="mt-3 break-words text-xl font-semibold text-white">{metric.value}</p>
            </section>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
