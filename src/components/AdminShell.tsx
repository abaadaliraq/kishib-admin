import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-4 py-5 lg:flex-row lg:px-8">
        <Sidebar />
        <main className="w-full rounded-lg border border-white/10 bg-zinc-950 p-5 shadow-[0_0_80px_rgba(0,0,0,0.35)] lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
