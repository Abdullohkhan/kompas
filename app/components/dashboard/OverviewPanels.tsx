import type { TrafficSource } from "./types";
import { baseCardClass, hoverLiftClass, primaryGradientClass } from "./styles";

type OverviewPanelsProps = {
  heroTitle: string;
  heroDescription: string;
  monthlyGoal: string;
  goalProgress: number;
  trafficSources: TrafficSource[];
  recentActivity: string[];
};

export function OverviewPanels({
  heroTitle,
  heroDescription,
  monthlyGoal,
  goalProgress,
  trafficSources,
  recentActivity,
}: OverviewPanelsProps) {
  return (
    <>
      <section className="mb-8 grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-linear-to-br from-indigo-500/20 via-sky-100 to-sky-400/10 p-7 shadow-[0_20px_45px_-30px_rgba(99,102,241,0.35)] transition-all duration-300 hover:border-indigo-400/50 dark:border-slate-800/80 dark:from-indigo-500/25 dark:via-slate-900 dark:to-sky-400/10 dark:shadow-[0_20px_45px_-30px_rgba(99,102,241,0.6)] lg:col-span-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">Welcome back, Lena</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{heroTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">{heroDescription}</p>
          <div className="mt-6 flex gap-3">
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100">
              View Insights
            </button>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
              Manage Team
            </button>
          </div>
        </article>
        <article className={`${baseCardClass} ${hoverLiftClass} p-6`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Goal</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{monthlyGoal}</p>
          <p className="mt-1 text-sm text-emerald-400">{goalProgress}% completed</p>
          <div className="mt-5 h-2.5 rounded-full bg-slate-800">
            <div className={`h-2.5 rounded-full ${primaryGradientClass}`} style={{ width: `${goalProgress}%` }} />
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className={`${baseCardClass} p-6 transition-all duration-300 hover:border-indigo-400/40 hover:shadow-[0_18px_40px_-26px_rgba(99,102,241,0.65)] lg:col-span-2`}>
          <h2 className="text-lg font-semibold">Traffic Sources</h2>
          <div className="mt-5 space-y-4">
            {trafficSources.map((source) => (
              <div key={source.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{source.name}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{source.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-2.5 rounded-full ${primaryGradientClass} transition-all duration-500`}
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={`${baseCardClass} p-6 transition-all duration-300 hover:border-sky-400/40 hover:shadow-[0_16px_35px_-20px_rgba(56,189,248,0.6)]`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {recentActivity.map((item) => (
              <li
                key={item}
                className="rounded-lg bg-slate-100 px-3 py-2.5 transition-colors duration-200 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
