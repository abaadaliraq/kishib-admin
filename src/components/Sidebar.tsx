"use client";

import {
  Activity,
  BadgePercent,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  Gem,
  LayoutDashboard,
  LogOut,
  Radio,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Live Users", href: "/dashboard/live-users", icon: Radio },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Active Free Users", href: "/dashboard/active-free-users", icon: UserCheck },
  { label: "Valuable Items", href: "/dashboard/valuable-items", icon: Gem },
  { label: "Discount Codes", href: "/dashboard/discount-codes", icon: BadgePercent },
  { label: "Coupon Performance", href: "/dashboard/coupon-performance", icon: BarChart3 },
  { label: "System Health", href: "/dashboard/system-health", icon: Activity },
  { label: "Watchlist", href: "/dashboard/watchlist", icon: Star },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserSupabaseClient();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("kishib:sidebar-collapsed") === "true";
    document.documentElement.style.setProperty("--kishib-sidebar-width", saved ? "72px" : "252px");
    const frame = window.requestAnimationFrame(() => setCollapsed(saved));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("kishib:sidebar-collapsed", String(next));
      document.documentElement.style.setProperty("--kishib-sidebar-width", next ? "72px" : "252px");
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-30 hidden shrink-0 border-r border-white/10 bg-zinc-950/95 text-sm text-slate-300 shadow-[0_0_60px_rgba(0,0,0,0.28)] backdrop-blur lg:flex lg:flex-col",
        collapsed ? "w-[72px]" : "w-[252px]",
      ].join(" ")}
    >
      <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className={collapsed ? "sr-only" : "min-w-0"}>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">KISHIB</p>
          <h2 className="truncate text-lg font-semibold tracking-tight text-white">Admin</h2>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={[
                  "flex h-11 items-center gap-3 rounded-lg px-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
                  active
                    ? "bg-amber-500/15 text-amber-100"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" />
                <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={[
            "flex h-11 w-full items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 text-left text-sm text-amber-100 transition hover:bg-amber-500/15",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={collapsed ? "sr-only" : "truncate"}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
