import type { Stat } from "./types";
import { baseCardClass, hoverLiftClass } from "./styles";

type StatsGridProps = {
  stats: Stat[];
  isLoading?: boolean;
};

export function StatsGrid({ stats, isLoading = false }: StatsGridProps) {
  if (isLoading) {
    return (
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className={`${baseCardClass} p-5`}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-8 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className={`${baseCardClass} ${hoverLiftClass} p-5`}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-400">{stat.trend}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
