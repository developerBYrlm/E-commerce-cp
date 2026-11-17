export function Loader({ label = "Loading LocalSphere" }) {
  return <div className="flex min-h-48 items-center justify-center gap-3 text-forest" role="status"><span className="loading loading-spinner loading-md" /><span className="text-sm font-medium">{label}</span></div>;
}

export function CardSkeleton() {
  return <div className="skeleton h-64 w-full rounded-3xl" aria-label="Loading content" />;
}
