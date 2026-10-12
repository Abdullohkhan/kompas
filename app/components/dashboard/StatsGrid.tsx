"use client";

import { useI18n } from "../../lib/i18n";
import type { Stat } from "../../lib/api/types";
import { baseCardClass, hoverLiftClass, mutedTextClass, trendTextClass } from "./styles";

type StatsGridProps = { stats: readonly Stat[]; isLoading?: boolean };

export function StatsGrid({ stats, isLoading = false }: StatsGridProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <section aria-busy="true" aria-label={t.common.loading} className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
    <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.key} className={`${baseCardClass} ${hoverLiftClass} p-5`}>
          <p className={`text-sm ${mutedTextClass}`}>{t.stats[stat.key].label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${trendTextClass}`}>{stat.trend}</p>
            <p className={`text-right text-xs ${mutedTextClass}`}>{t.stats[stat.key].hint}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
