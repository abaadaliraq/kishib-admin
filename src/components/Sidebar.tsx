"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Subscriptions", href: "/dashboard/subscriptions" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Discount Codes", href: "/dashboard/discount-codes" },
];

export default function Sidebar() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm text-slate-300 shadow-[0_0_60px_rgba(0,0,0,0.28)] lg:w-72">
      <div className="mb-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-200/80">KISHIB Admin</p>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h2>
      </div>

      <nav className="flex flex-1 flex-wrap gap-2 lg:flex-col">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-3 transition hover:bg-amber-500/10 hover:text-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100 transition hover:bg-amber-500/15"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
