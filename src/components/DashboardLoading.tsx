import AdminShell from "@/components/AdminShell";

export default function DashboardLoading({ title = "Loading" }: { title?: string }) {
  return (
    <AdminShell>
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300/80">{title}</p>
            <p className="mt-2 text-sm text-slate-400">Please wait while the admin data loads.</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
