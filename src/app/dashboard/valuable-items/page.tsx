import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-dashboard-data";
import { getCloudinaryImageUrl } from "@/lib/cloudinary";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type ValuableItem = {
  id: string;
  title: string | null;
  item_type: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  estimated_value: string | number | null;
  user_name: string | null;
  user_email: string | null;
  user_country: string | null;
  created_at: string | null;
};

function parseValuableItems(data: unknown) {
  return (Array.isArray(data) ? data : [])
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const row = value as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : null;
      if (!id) return null;

      return {
        id,
        title: typeof row.title === "string" ? row.title : null,
        item_type: typeof row.item_type === "string" ? row.item_type : null,
        image_url: typeof row.image_url === "string" ? row.image_url : null,
        cloudinary_public_id: typeof row.cloudinary_public_id === "string" ? row.cloudinary_public_id : null,
        estimated_value:
          typeof row.estimated_value === "string" || typeof row.estimated_value === "number"
            ? row.estimated_value
            : null,
        user_name: typeof row.user_name === "string" ? row.user_name : null,
        user_email: typeof row.user_email === "string" ? row.user_email : null,
        user_country: typeof row.user_country === "string" ? row.user_country : null,
        created_at: typeof row.created_at === "string" ? row.created_at : null,
      };
    })
    .filter((item): item is ValuableItem => Boolean(item));
}

async function fetchValuableItems() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("evaluations")
      .select("id,title,item_type,image_url,cloudinary_public_id,estimated_value,user_name,user_email,user_country,created_at")
      .not("estimated_value", "is", null)
      .order("estimated_value", { ascending: false })
      .limit(100);

    if (error) return { items: [], hasEstimatedValue: false };
    return { items: parseValuableItems(data), hasEstimatedValue: true };
  } catch {
    return { items: [], hasEstimatedValue: false };
  }
}

function imageFor(item: ValuableItem) {
  return getCloudinaryImageUrl(item.image_url) || getCloudinaryImageUrl(item.cloudinary_public_id);
}

export default async function ValuableItemsPage() {
  await requireAdmin();
  const { items, hasEstimatedValue } = await fetchValuableItems();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">Risk & Value</p>
          <h1 className="text-3xl font-semibold text-white">Valuable Items</h1>
          <p className="max-w-2xl text-slate-400">Highest estimated-value evaluations when the estimated_value column is available.</p>
        </header>

        {!hasEstimatedValue ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">estimated_value is not available</p>
            <p className="mt-2 text-sm text-slate-400">Add an estimated_value column to evaluations to populate this page.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-8 text-slate-300">
            <p className="text-lg font-semibold text-white">No valuable items yet</p>
            <p className="mt-2 text-sm text-slate-400">Rows with estimated_value will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950">
            <table className="min-w-[1200px] border-separate border-spacing-0 text-left text-sm text-slate-300">
              <thead className="bg-zinc-900 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Image</th>
                  <th className="px-4 py-4">Item</th>
                  <th className="px-4 py-4">Estimated Value</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Country</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const imageUrl = imageFor(item);

                  return (
                    <tr key={item.id} className="border-t border-white/5">
                      <td className="px-4 py-4">
                        {imageUrl ? (
                          <a href={imageUrl} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={item.title ?? "Valuable item"} className="h-full w-full object-cover" />
                          </a>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-slate-500">No image</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white">{item.title ?? item.item_type ?? "-"}</td>
                      <td className="px-4 py-4 text-amber-200">{item.estimated_value ?? "-"}</td>
                      <td className="px-4 py-4">{item.user_name ?? item.user_email ?? "-"}</td>
                      <td className="px-4 py-4">{item.user_country ?? "-"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/reports/${item.id}`} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100">
                          View Report
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
