"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function titleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "dashboard";
  return lastSegment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminTopHeader({
  adminEmail,
  adminRole,
}: {
  adminEmail?: string | null;
  adminRole?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString());

  const refresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">KISHIB Admin</p>
          <h1 className="truncate text-xl font-semibold text-white">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
            {adminRole ? `Role: ${adminRole}` : "Protected session"}
          </span>
          {adminEmail ? (
            <span className="max-w-[220px] truncate rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
              {adminEmail}
            </span>
          ) : null}
          <span className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
            Last updated {lastUpdated || "-"}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 font-semibold text-black transition hover:bg-amber-400"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
