import { ReactNode } from "react";
import AdminTopHeader from "@/components/AdminTopHeader";
import Sidebar from "@/components/Sidebar";

export default function AdminShell({
  children,
  adminEmail,
  adminRole,
}: {
  children: ReactNode;
  adminEmail?: string | null;
  adminRole?: string | null;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 lg:pl-[var(--kishib-sidebar-width,252px)]">
        <AdminTopHeader adminEmail={adminEmail} adminRole={adminRole} />
        <main className="min-w-0 flex-1 overflow-hidden p-4 lg:p-6">
          <div className="mx-auto min-w-0 max-w-[1600px] rounded-lg border border-white/10 bg-zinc-950/80 p-4 shadow-[0_0_80px_rgba(0,0,0,0.35)] lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
