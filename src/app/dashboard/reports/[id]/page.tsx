import AdminShell from "@/components/AdminShell";
import { getCloudinaryImageUrl } from "@/lib/cloudinary";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  analysis_result: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

async function fetchEvaluation(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("evaluations")
    .select(
      "id,user_id,user_email,user_name,user_phone,user_country,user_city,user_province,title,locale,item_type,image_url,cloudinary_public_id,analysis_result,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { evaluation: null, error: error.message };
  }

  return { evaluation: data as EvaluationRow | null, error: null };
}

function readAnalysisText(result: Record<string, unknown> | null, keys: string[]) {
  if (!result) return null;

  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getEvaluationTitle(evaluation: EvaluationRow) {
  return (
    evaluation.title ||
    readAnalysisText(evaluation.analysis_result, ["title", "itemType", "lookup"]) ||
    "Untitled item"
  );
}

function getEvaluationImage(evaluation: EvaluationRow) {
  const resultImage = readAnalysisText(evaluation.analysis_result, [
    "uploadedImageUrl",
    "sourceImageUrl",
    "imageUrl",
    "originalImage",
    "imagePreview",
  ]);
  const resultPublicId = readAnalysisText(evaluation.analysis_result, [
    "cloudinaryPublicId",
    "cloudinary_public_id",
  ]);

  return (
    getCloudinaryImageUrl(evaluation.image_url) ||
    getCloudinaryImageUrl(resultImage) ||
    getCloudinaryImageUrl(evaluation.cloudinary_public_id) ||
    getCloudinaryImageUrl(resultPublicId)
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm text-slate-100">{value || "-"}</p>
    </div>
  );
}

export default async function EvaluationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { evaluation, error } = await fetchEvaluation(id);

  if (!evaluation && !error) {
    notFound();
  }

  const imageUrl = evaluation ? getEvaluationImage(evaluation) : null;
  const title = evaluation ? getEvaluationTitle(evaluation) : "Evaluation";
  const location = evaluation
    ? [evaluation.user_city, evaluation.user_province, evaluation.user_country].filter(Boolean).join(", ")
    : "";

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-3">
          <Link href="/dashboard/reports" className="text-sm text-amber-200 hover:text-amber-100">
            Back to reports
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Evaluation</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">Unable to load evaluation</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
          </div>
        ) : evaluation ? (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <section className="rounded-lg border border-white/10 bg-black p-4">
              {imageUrl ? (
                <a href={imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={title} className="max-h-[560px] w-full object-contain" />
                </a>
              ) : (
                <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-white/10 text-slate-500">
                  No image
                </div>
              )}
              {imageUrl ? (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  Open original image
                </a>
              ) : null}
            </section>

            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="User name" value={evaluation.user_name} />
                <Field label="Email" value={evaluation.user_email || evaluation.user_id} />
                <Field label="Phone" value={evaluation.user_phone} />
                <Field label="Location" value={location} />
                <Field label="Item type" value={evaluation.item_type} />
                <Field label="Locale" value={evaluation.locale} />
                <Field
                  label="Created"
                  value={evaluation.created_at ? new Date(evaluation.created_at).toLocaleString() : null}
                />
                <Field label="Cloudinary public id" value={evaluation.cloudinary_public_id} />
              </div>

              <div className="rounded-lg border border-white/10 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Analysis Result</p>
                <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
                  {JSON.stringify(evaluation.analysis_result ?? {}, null, 2)}
                </pre>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
