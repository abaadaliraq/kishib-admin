export default function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
      <p className="text-sm uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
