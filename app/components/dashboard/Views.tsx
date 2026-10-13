"use client";

import { useMemo, useState } from "react";
import { format, LOCALES, useI18n } from "../../lib/i18n";
import type { BillingStatus, Charts, Customer, Report, TeamMember, User } from "../../lib/api/types";
import { formatDate } from "../../lib/api/format";
import { useTheme } from "../../lib/theme";
import { BarChart } from "./BarChart";
import { baseCardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from "./styles";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ---------- Overview / Analytics extras ---------- */

export function OverviewChart({ charts }: { charts: Charts }) {
  const { t, format: f } = useI18n();
  return (
    <div className="mt-8">
      <BarChart
        title={t.sections.revenueChart}
        ariaLabel={f(t.chart.ariaLabel, { title: t.sections.revenueChart })}
        labels={charts.revenueByMonth.map((p) => t.chart.months[p.month])}
        values={charts.revenueByMonth.map((p) => p.value)}
        formatValue={(v) => `$${(v / 1000).toFixed(1)}k`}
      />
    </div>
  );
}

export function AnalyticsExtras({ charts }: { charts: Charts }) {
  const { t, format: f } = useI18n();
  const topPages = charts.topPages;
  const max = Math.max(1, ...topPages.map((p) => p.views));
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <BarChart
        title={t.sections.sessionsChart}
        ariaLabel={f(t.chart.ariaLabel, { title: t.sections.sessionsChart })}
        labels={charts.sessionsByDay.map((p) => t.chart.weekdays[p.weekday])}
        values={charts.sessionsByDay.map((p) => p.value)}
        formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
      />
      <article className={`${baseCardClass} p-6`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.topPages}</h2>
        <ul className="mt-5 space-y-3.5">
          {topPages.map((page) => (
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

type CustomersViewProps = { customers: Customer[]; isAdmin: boolean; onAdd: () => void; onRemove: (customer: Customer) => void };

export function CustomersView({ customers, isAdmin, onAdd, onRemove }: CustomersViewProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q));
  }, [query, customers]);

  return (
    <article className={`${baseCardClass} mt-8 p-4 sm:p-6`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.nav.customers}</h2>
        <div className="flex gap-2 sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            aria-label={t.common.search}
            className={`${inputClass} sm:w-64`}
          />
          {isAdmin && (
            <button type="button" onClick={onAdd} className={`${primaryButtonClass} shrink-0`}>
              {t.customers.add}
            </button>
          )}
        </div>
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
                {[t.customers.colName, t.customers.colCompany, t.customers.colPlan, t.customers.colStatus, t.customers.colSpent, t.customers.colJoined, ...(isAdmin ? [""] : [])].map((h, i) => (
                  <th key={i} scope="col" className="px-3 py-2 font-medium">{h}</th>
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
                  {isAdmin && (
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => onRemove(c)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                        {t.customers.remove}
                      </button>
                    </td>
                  )}
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

export function TeamList({ members }: { members: TeamMember[] }) {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {members.map((m) => (
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

export function InviteForm({ onInvite }: { onInvite: (email: string) => Promise<void> }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim() || busy) return;
        setBusy(true);
        try {
          await onInvite(email.trim());
          setEmail("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.team.invitePlaceholder} aria-label={t.team.inviteLabel} className={inputClass} />
      <button type="submit" disabled={busy} className={`${primaryButtonClass} shrink-0 disabled:opacity-60`}>{t.common.invite}</button>
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

type SettingsViewProps = {
  user: User;
  members: TeamMember[];
  onSaveProfile: (data: { name: string; phone: string; company: string }) => Promise<void>;
  onInvite: (email: string) => Promise<void>;
  onChangePassword: (current: string, next: string) => Promise<boolean>;
  billing: BillingStatus | undefined;
  onUpgrade: () => void;
  onManageBilling: () => void;
};

function PasswordCard({ onChangePassword }: { onChangePassword: (current: string, next: string) => Promise<boolean> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <article className={`${baseCardClass} p-6`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.settings.changePassword}</h2>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          setBusy(true);
          try {
            if (await onChangePassword(String(data.get("current")), String(data.get("next")))) form.reset();
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.settings.currentPassword}</span>
          <input name="current" type="password" required autoComplete="current-password" maxLength={72} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.settings.newPassword}</span>
          <input name="next" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={`${inputClass} mt-1`} />
          <span className={`mt-1 block text-xs ${mutedTextClass}`}>{t.auth.passwordHint}</span>
        </label>
        <button type="submit" disabled={busy} className={`${primaryButtonClass} disabled:opacity-60`}>{t.common.save}</button>
      </form>
    </article>
  );
}

export function SettingsView({ user, members, onSaveProfile, onInvite, onChangePassword, billing, onUpgrade, onManageBilling }: SettingsViewProps) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const fields = [
    { key: "name", label: t.settings.name, value: user.name, type: "text", readOnly: false },
    { key: "email", label: t.settings.email, value: user.email, type: "email", readOnly: true },
    { key: "phone", label: t.settings.phone, value: user.phone ?? "", type: "tel", readOnly: false },
    { key: "company", label: t.settings.company, value: user.company ?? "", type: "text", readOnly: false },
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
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setSaving(true);
            try {
              await onSaveProfile({
                name: String(form.get("name") ?? ""),
                phone: String(form.get("phone") ?? ""),
                company: String(form.get("company") ?? ""),
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className={mutedTextClass}>{f.label}</span>
              <input name={f.key} type={f.type} defaultValue={f.value} readOnly={f.readOnly} required={f.key === "name"} className={`${inputClass} mt-1 ${f.readOnly ? "opacity-70" : ""}`} />
            </label>
          ))}
          <button type="submit" disabled={saving} className={`${primaryButtonClass} disabled:opacity-60`}>{t.common.save}</button>
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.sections.billing}</h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {billing?.plan === "pro" ? t.upgrade.proName : t.upgrade.freeName}
            {billing?.viaSubscription && billing.currentPeriodEnd
              ? ` · ${format(billing.cancelAtPeriodEnd ? t.upgrade.endsOn : t.upgrade.renews, { date: formatDate(billing.currentPeriodEnd) })}`
              : ""}
          </p>
          {billing?.plan === "pro" && !billing.viaSubscription && <p className={`mt-1 text-xs ${mutedTextClass}`}>{t.upgrade.adminNote}</p>}
          <button type="button" onClick={billing?.viaSubscription ? onManageBilling : onUpgrade} className={`${primaryButtonClass} mt-4`}>
            {billing?.viaSubscription ? t.upgrade.manage : t.upgrade.startTrial}
          </button>
        </article>

        <PasswordCard onChangePassword={onChangePassword} />

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
        <TeamList members={members} />
        <InviteForm onInvite={onInvite} />
      </article>
    </div>
  );
}
