"use client";

import { useMemo, useState } from "react";
import { format, LOCALES, useI18n } from "../../lib/i18n";
import {
  CUSTOMERS,
  DEMO_USER,
  REVENUE_BY_MONTH,
  SESSIONS_BY_WEEKDAY,
  TEAM,
  TOP_PAGES,
  type Report,
} from "../../lib/mock";
import { useTheme } from "../../lib/theme";
import { BarChart } from "./BarChart";
import { baseCardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import { useToast } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");
/** Deterministic dd.mm.yyyy so server and client render identically. */
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad(d)}.${pad(m)}.${y}`;
};
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ---------- Overview / Analytics extras ---------- */

export function OverviewChart() {
  const { t, format: f } = useI18n();
  return (
    <div className="mt-8">
      <BarChart
        title={t.sections.revenueChart}
        ariaLabel={f(t.chart.ariaLabel, { title: t.sections.revenueChart })}
        labels={t.chart.months}
        values={REVENUE_BY_MONTH}
        formatValue={(v) => `$${(v / 1000).toFixed(1)}k`}
      />
    </div>
  );
}

export function AnalyticsExtras() {
  const { t, format: f } = useI18n();
  const max = TOP_PAGES[0].views;
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <BarChart
        title={t.sections.sessionsChart}
        ariaLabel={f(t.chart.ariaLabel, { title: t.sections.sessionsChart })}
        labels={t.chart.weekdays}
        values={SESSIONS_BY_WEEKDAY}
        formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
      />
      <article className={`${baseCardClass} p-6`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.topPages}</h2>
        <ul className="mt-5 space-y-3.5">
          {TOP_PAGES.map((page) => (
            <li key={page.path}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate font-mono text-xs text-slate-700 dark:text-slate-300 sm:text-sm">{page.path}</span>
                <span className="shrink-0 text-slate-900 dark:text-slate-100">
                  {page.views.toLocaleString("en-US")} <span className={mutedTextClass}>{t.sections.views}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${(page.views / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

/* ---------- Customers ---------- */

const statusClass = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

export function CustomersView() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CUSTOMERS;
    return CUSTOMERS.filter((c) => `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <article className={`${baseCardClass} mt-8 p-4 sm:p-6`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.nav.customers}</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.common.searchPlaceholder}
          aria-label={t.common.search}
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>
      {rows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-900 dark:text-slate-100">{t.common.noResults}</p>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>{t.common.noResultsHint}</p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>
              <tr>
                {[t.customers.colName, t.customers.colCompany, t.customers.colPlan, t.customers.colStatus, t.customers.colSpent, t.customers.colJoined].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                    <p className={`text-xs ${mutedTextClass}`}>{c.email} · {c.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{c.company}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{t.customers.plan[c.plan]}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[c.status]}`}>{t.customers.status[c.status]}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-900 dark:text-slate-100">{money(c.spent)}</td>
                  <td className={`px-3 py-3 ${mutedTextClass}`}>{formatDate(c.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

/* ---------- Reports ---------- */

export function reportName(report: Report, names: Record<string, string>): string {
  return report.customName ?? (report.nameKey ? names[report.nameKey] : "");
}

type ReportsViewProps = { reports: Report[]; onDownload: (report: Report) => void; onNew: () => void };

export function ReportsView({ reports, onDownload, onNew }: ReportsViewProps) {
  const { t } = useI18n();
  return (
    <article className={`${baseCardClass} mt-8 p-4 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.nav.reports}</h2>
        <button type="button" onClick={onNew} className={primaryButtonClass}>{t.common.newReport}</button>
      </div>
      {reports.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-900 dark:text-slate-100">{t.common.emptyReports}</p>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>{t.common.emptyReportsHint}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">{reportName(r, t.reports.names)}</p>
                <p className={`text-xs ${mutedTextClass}`}>
                  {t.reports.types[r.type]} · {formatDate(r.createdAt)} · {t.reports.status[r.status]}
                </p>
              </div>
              <button type="button" onClick={() => onDownload(r)} className={secondaryButtonClass}>{t.common.download} CSV</button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ---------- Team (shared by Settings and the Manage Team modal) ---------- */

export function TeamList() {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {TEAM.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {m.name.split(" ").map((p) => p[0]).join("")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
              <p className={`truncate text-xs ${mutedTextClass}`}>{m.email}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">{t.team.role[m.role]}</span>
        </li>
      ))}
    </ul>
  );
}

export function InviteForm() {
  const { t } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState("");
  return (
    <form
      className="mt-4 flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        toast(format(t.team.invited, { email: email.trim() }));
        setEmail("");
      }}
    >
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.team.invitePlaceholder} aria-label={t.team.inviteLabel} className={inputClass} />
      <button type="submit" className={`${primaryButtonClass} shrink-0`}>{t.common.invite}</button>
    </form>
  );
}

/* ---------- Settings ---------- */

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(Boolean(defaultOn));
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function SettingsView() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const fields = [
    { key: "name", label: t.settings.name, value: DEMO_USER.name, type: "text" },
    { key: "email", label: t.settings.email, value: DEMO_USER.email, type: "email" },
    { key: "phone", label: t.settings.phone, value: DEMO_USER.phone, type: "tel" },
    { key: "company", label: t.settings.company, value: DEMO_USER.company, type: "text" },
  ];
  const segment = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-300"
        : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <article className={`${baseCardClass} p-6`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.profile}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            toast(t.settings.saved);
          }}
        >
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className={mutedTextClass}>{f.label}</span>
              <input type={f.type} defaultValue={f.value} className={`${inputClass} mt-1`} />
            </label>
          ))}
          <button type="submit" className={primaryButtonClass}>{t.common.save}</button>
        </form>
      </article>

      <div className="space-y-5">
        <article className={`${baseCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.preferences}</h2>
          <p className={`mt-4 text-sm ${mutedTextClass}`}>{t.settings.language}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LOCALES.map((code) => (
              <button key={code} type="button" aria-pressed={locale === code} onClick={() => setLocale(code)} className={segment(locale === code)}>
                {t.languages[code]}
              </button>
            ))}
          </div>
          <p className={`mt-4 text-sm ${mutedTextClass}`}>{t.settings.theme}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")} className={segment(theme === "light")}>{t.settings.light}</button>
            <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} className={segment(theme === "dark")}>{t.settings.dark}</button>
          </div>
        </article>

        <article className={`${baseCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.notifications}</h2>
          <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            <Toggle label={t.settings.notifEmail} defaultOn />
            <Toggle label={t.settings.notifWeekly} defaultOn />
            <Toggle label={t.settings.notifAlerts} />
          </div>
        </article>
      </div>

      <article className={`${baseCardClass} p-6 lg:col-span-2`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.team}</h2>
        <TeamList />
        <InviteForm />
      </article>
    </div>
  );
}
