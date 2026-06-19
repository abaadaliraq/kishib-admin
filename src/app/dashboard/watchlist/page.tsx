import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-dashboard-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type WatchlistRow = {
  id: string;
  report_id: string;
  admin_user_id: string | null;
  note: string | null;
  created_at: string | null;
};

function parseRows(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const row = value as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : null;
      const reportId = typeof row.report_id === "string" ? row.report_id : null;
      if (!id || !reportId) return null;

      return {
        id,
        report_id: reportId,
        admin_user_id: typeof row.admin_user_id === "string" ? row.admin_user_id : null,
        note: typeof row.note === "string" ? row.note : null,
        created_at: typeof row.created_at === "string" ? row.created_at : null,
      };
    })
    .filter((row): row is WatchlistRow => Boolean(row));
}

async function fetchWatchlist() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("report_watchlist")
      .select("id,report_id,admin_user_id,note,created_at")
      .order("created_at", { ascending: false });

    if (error) return { rows: [], available: false };
    return { rows: parseRows(data), available: true };
  } catch {
    return { rows: [], available: false };
  }
}

export default async function WatchlistPage() {
  await requireAdmin();
  const { rows, available } = await fetchWatchlist();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Review</p>
          <h1 className="text-3xl font-semibold text-white">Watchlist</h1>
          <p className="max-w-2xl text-slate-400">Reports marked for admin follow-up when report_watchlist exists.</p>
        </header>

        {!available ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Watchlist table is not available</p>
            <p className="mt-2 text-sm text-slate-400">Add the suggested report_watchlist SQL from README to enable this page.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No watched reports</p>
            <p className="mt-2 text-sm text-slate-400">Watchlist rows will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950">
            <table className="min-w-[900px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Report ID</th>
                  <th className="px-4 py-4">Admin User</th>
                  <th className="px-4 py-4">Note</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="max-w-[240px] break-all px-4 py-4 font-mono text-xs text-slate-400">{row.report_id}</td>
                    <td className="max-w-[240px] break-all px-4 py-4 font-mono text-xs text-slate-500">{row.admin_user_id ?? "-"}</td>
                    <td className="px-4 py-4 text-white">{row.note ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-400">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/reports/${row.report_id}`} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100">
                        View Report
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
