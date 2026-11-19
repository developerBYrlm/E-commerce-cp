export function Loader({ label = "Loading LocalSphere" }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-forest dark:text-emerald-400" role="status">
      <div className="flex items-center gap-1.5 h-7">
        <span className="w-1.5 h-3.5 rounded-full bg-forest animate-[pulse_0.6s_ease-in-out_infinite] dark:bg-emerald-400" />
        <span className="w-1.5 h-6 rounded-full bg-emerald-500 animate-[pulse_0.6s_ease-in-out_0.15s_infinite]" />
        <span className="w-1.5 h-4.5 rounded-full bg-lime animate-[pulse_0.6s_ease-in-out_0.3s_infinite]" />
        <span className="w-1.5 h-6 rounded-full bg-cyan-500 animate-[pulse_0.6s_ease-in-out_0.45s_infinite]" />
        <span className="w-1.5 h-3.5 rounded-full bg-emerald-400 animate-[pulse_0.6s_ease-in-out_0.6s_infinite]" />
      </div>
      <span className="text-sm font-semibold tracking-wide text-forest/80 dark:text-slate-300">{label}</span>
    </div>
  );
}

export function CardSkeleton() {
  return <div className="skeleton h-64 w-full rounded-3xl" aria-label="Loading content" />;
}
