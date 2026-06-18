import AdminShell from "@/components/AdminShell";
import { getCloudinaryImageUrl } from "@/lib/cloudinary";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EvaluationRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  user_phone: string | null;
  user_country: string | null;
  user_city: string | null;
  user_province: string | null;
  title: string | null;
  locale: string | null;
  item_type: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function fetchEvaluations() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select(
        "id,user_id,user_email,user_name,user_phone,user_country,user_city,user_province,title,locale,item_type,image_url,cloudinary_public_id,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return { evaluations: [], error: error.message };
    }

    return { evaluations: (data ?? []) as EvaluationRow[], error: null };
  } catch (error) {
    return {
      evaluations: [],
      error: error instanceof Error ? error.message : "Unable to load evaluations.",
    };
  }
}

function getEvaluationTitle(evaluation: EvaluationRow) {
  return evaluation.title || evaluation.item_type || "Untitled item";
}

function getEvaluationImage(evaluation: EvaluationRow) {
  return (
    getCloudinaryImageUrl(evaluation.image_url) ||
    getCloudinaryImageUrl(evaluation.cloudinary_public_id)
  );
}

export default async function DashboardReportsPage() {
  await requireAdmin();
  const { evaluations, error } = await fetchEvaluations();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Reports</p>
          <h1 className="text-3xl font-semibold text-white">User Evaluations</h1>
          <p className="max-w-2xl text-slate-400">Evaluation history from Supabase with Cloudinary upload previews.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Unable to load evaluations</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No evaluations yet</p>
            <p className="mt-2 text-sm text-slate-400">Saved evaluations from the application will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 shadow-lg">
            <table className="min-w-[2600px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Image</th>
                  <th className="px-4 py-4">Evaluation ID</th>
                  <th className="px-4 py-4">User ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Province</th>
                  <th className="px-4 py-4">City</th>
                  <th className="px-4 py-4">Item</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Locale</th>
                  <th className="px-4 py-4">Image URL</th>
                  <th className="px-4 py-4">Cloudinary ID</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Updated</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => {
                  const imageUrl = getEvaluationImage(evaluation);

                  return (
                    <tr key={evaluation.id} className="border-t border-white/5 align-top">
                      <td className="px-4 py-4">
                        {imageUrl ? (
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-20 w-20 overflow-hidden rounded-lg border border-white/10 bg-black"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={getEvaluationTitle(evaluation)}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="max-w-[220px] break-all px-4 py-4 font-mono text-xs text-slate-500">{evaluation.id}</td>
                      <td className="max-w-[220px] break-all px-4 py-4 font-mono text-xs text-slate-500">{evaluation.user_id || "-"}</td>
                      <td className="px-4 py-4 text-white">{evaluation.user_name || "-"}</td>
                      <td className="px-4 py-4">{evaluation.user_email || "-"}</td>
                      <td className="px-4 py-4">{evaluation.user_phone || "-"}</td>
                      <td className="px-4 py-4">{evaluation.user_country || "-"}</td>
                      <td className="px-4 py-4">{evaluation.user_province || "-"}</td>
                      <td className="px-4 py-4">{evaluation.user_city || "-"}</td>
                      <td className="px-4 py-4 text-white">{getEvaluationTitle(evaluation)}</td>
                      <td className="px-4 py-4 text-slate-400">{evaluation.item_type || "-"}</td>
                      <td className="px-4 py-4 text-slate-400">{evaluation.locale || "-"}</td>
                      <td className="max-w-[260px] break-all px-4 py-4 text-xs text-slate-500">{evaluation.image_url || "-"}</td>
                      <td className="max-w-[240px] break-all px-4 py-4 font-mono text-xs text-slate-500">
                        {evaluation.cloudinary_public_id || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {evaluation.created_at ? new Date(evaluation.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {evaluation.updated_at ? new Date(evaluation.updated_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/reports/${evaluation.id}`}
                          className="inline-flex rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/15"
                        >
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
