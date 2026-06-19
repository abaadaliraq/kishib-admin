"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "@/components/StatCard";

type Stat = {
  label: string;
  value: string | number;
  href: string;
};

type ChartPoint = {
  label: string;
  count: number;
};

function EmptyChart({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-500">
        No chart data available.
      </div>
    </section>
  );
}

export default function DashboardOverviewClient({
  stats,
  evaluationsLast7Days,
  providerBreakdown,
}: {
  stats: Stat[];
  evaluationsLast7Days: ChartPoint[];
  providerBreakdown: ChartPoint[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.025 }}
          >
            <Link href={stat.href} className="block transition hover:-translate-y-0.5">
              <StatCard label={stat.label} value={stat.value} />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {evaluationsLast7Days.length === 0 ? (
          <EmptyChart title="Evaluations last 7 days" />
        ) : (
          <section className="rounded-lg border border-white/10 bg-black p-5">
            <h2 className="text-lg font-semibold text-white">Evaluations last 7 days</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evaluationsLast7Days}>
                  <CartesianGrid stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {providerBreakdown.length === 0 ? (
          <EmptyChart title="Users by provider" />
        ) : (
          <section className="rounded-lg border border-white/10 bg-black p-5">
            <h2 className="text-lg font-semibold text-white">Users by provider</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_160px]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerBreakdown}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="hidden h-64 lg:block">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={providerBreakdown} dataKey="count" nameKey="label" innerRadius={38} outerRadius={68} fill="#f59e0b" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
