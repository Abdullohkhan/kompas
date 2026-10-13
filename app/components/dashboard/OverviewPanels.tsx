"use client";

import { format, useI18n } from "../../lib/i18n";
import { activityText, formatDate } from "../../lib/api/format";
import type { PageData, PageId } from "../../lib/api/types";
import { baseCardClass, hoverLiftClass, mutedTextClass, primaryGradientClass, trendTextClass } from "./styles";

type OverviewPanelsProps = {
  page: PageId;
  data: PageData;
  onViewInsights: () => void;
  onManageTeam: () => void;
  onNewOrder?: () => void;
  userName: string;
};

const goalNumber = (kind: string, n: number) => (kind === "revenue" ? `$${n.toLocaleString("en-US")}` : n.toLocaleString("en-US"));

export function OverviewPanels({ page, data, onViewInsights, onManageTeam, onNewOrder, userName }: OverviewPanelsProps) {
  const { t } = useI18n();
  return (
    <>
      <section className="mb-8 grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-linear-to-br from-indigo-500/20 via-sky-100 to-sky-400/10 p-6 shadow-[0_20px_45px_-30px_rgba(99,102,241,0.35)] transition-all duration-300 hover:border-indigo-400/50 dark:border-slate-800/80 dark:from-indigo-500/25 dark:via-slate-900 dark:to-sky-400/10 dark:shadow-[0_20px_45px_-30px_rgba(99,102,241,0.6)] sm:p-7 lg:col-span-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">{format(t.common.welcome, { name: userName.split(" ")[0] })}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{t.hero[page].title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t.hero[page].desc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onViewInsights}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {t.common.viewInsights}
            </button>
            <button
              type="button"
              onClick={onManageTeam}
              className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t.common.manageTeam}
            </button>
            {onNewOrder && (
              <button
                type="button"
                onClick={onNewOrder}
                className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t.orders.new}
              </button>
            )}
          </div>
        </article>
        <article className={`${baseCardClass} ${hoverLiftClass} p-6`}>
          <p className={`text-sm ${mutedTextClass}`}>{t.common.monthlyGoal}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {goalNumber(data.goal.kind, data.goal.current)}
            <span className={`text-base font-medium ${mutedTextClass}`}> / {goalNumber(data.goal.kind, data.goal.target)} {t.goal[data.goal.kind]}</span>
          </p>
          <p className={`mt-1 text-sm ${trendTextClass}`}>{format(t.common.completed, { n: data.goal.progress })}</p>
          <div
            role="progressbar"
            aria-valuenow={data.goal.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t.common.monthlyGoal}
            className="mt-5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800"
          >
            <div className={`h-2.5 rounded-full ${primaryGradientClass}`} style={{ width: `${data.goal.progress}%` }} />
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className={`${baseCardClass} p-6 transition-all duration-300 hover:border-indigo-400/40 lg:col-span-2`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.breakdown[page]}</h2>
          <div className="mt-5 space-y-4">
            {data.traffic.length === 0 && <p className={`text-sm ${mutedTextClass}`}>{t.common.noResults}</p>}
            {data.traffic.map((source) => (
              <div key={source.key}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{t.traffic[source.key]}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{source.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-2.5 rounded-full ${primaryGradientClass} transition-all duration-500`} style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={`${baseCardClass} p-6 transition-all duration-300 hover:border-sky-400/40`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.common.recentActivity}</h2>
          {data.activity.length === 0 ? (
            <p className={`mt-5 text-sm ${mutedTextClass}`}>{t.activity.empty}</p>
          ) : (
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {data.activity.map((event) => (
                <li key={event.id} className="rounded-lg bg-slate-100 px-3 py-2.5 transition-colors duration-200 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80">
                  {activityText(t, event)}
                  <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>{formatDate(event.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}
