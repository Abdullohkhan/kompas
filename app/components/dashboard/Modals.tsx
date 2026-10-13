"use client";

import { useState } from "react";
import { useI18n } from "../../lib/i18n";
import { insightText } from "../../lib/api/format";
import type { Customer, Insight, PageId, ReportType, TeamMember } from "../../lib/api/types";
import { InviteForm, TeamList } from "./Views";
import { inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import { Modal } from "./ui";

type BaseProps = { open: boolean; onClose: () => void };

export function InsightsModal({ open, onClose, page, insights }: BaseProps & { page: PageId; insights: Insight[] }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={`${t.insights.title}: ${t.titles[page]}`} subtitle={t.insights.subtitle}>
      {insights.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{t.insights.empty}</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((item) => (
            <li key={item.type} className="flex gap-3 rounded-xl bg-slate-100 p-3.5 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
              {insightText(t, item)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className={secondaryButtonClass}>{t.common.close}</button>
      </div>
    </Modal>
  );
}

export function TeamModal({ open, onClose, members, onInvite }: BaseProps & { members: TeamMember[]; onInvite: (email: string) => Promise<void> }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t.team.title} subtitle={t.team.subtitle}>
      <TeamList members={members} />
      <InviteForm onInvite={onInvite} />
    </Modal>
  );
}

export function UpgradeModal({ open, onClose, onStart }: BaseProps & { onStart: () => Promise<void> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const plan = (name: string, price: string, items: readonly string[], highlight: boolean) => (
    <div className={`rounded-xl border p-4 ${highlight ? "border-sky-500 bg-sky-500/5" : "border-slate-200 dark:border-slate-700"}`}>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
        {price}<span className={`text-sm font-normal ${mutedTextClass}`}>{t.upgrade.perMonth}</span>
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {items.map((i) => (
          <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">✓</span>{i}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <Modal open={open} onClose={onClose} title={t.upgrade.title} subtitle={t.upgrade.subtitle}>
      <div className="grid gap-3 sm:grid-cols-2">
        {plan(t.upgrade.freeName, "$0", t.upgrade.free, false)}
        {plan(t.upgrade.proName, "$29", t.upgrade.pro, true)}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className={secondaryButtonClass}>{t.common.cancel}</button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onStart();
            } finally {
              setBusy(false);
            }
          }}
          className={`${primaryButtonClass} disabled:opacity-60`}
        >
          {busy ? t.upgrade.redirecting : t.upgrade.startTrial}
        </button>
      </div>
    </Modal>
  );
}

const REPORT_TYPES: ReportType[] = ["sales", "finance", "marketing", "ops"];

export function NewReportModal({ open, onClose, onCreate }: BaseProps & { onCreate: (name: string, type: ReportType) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("sales");
  return (
    <Modal open={open} onClose={onClose} title={t.reports.createTitle}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate(name.trim() || t.reports.defaultName, type);
          setName("");
          setType("sales");
        }}
      >
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.reports.nameLabel}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.reports.namePlaceholder} className={`${inputClass} mt-1`} autoFocus />
        </label>
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.reports.typeLabel}</span>
          <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className={`${inputClass} mt-1`}>
            {REPORT_TYPES.map((rt) => (
              <option key={rt} value={rt}>{t.reports.types[rt]}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>{t.common.cancel}</button>
          <button type="submit" className={primaryButtonClass}>{t.common.create}</button>
        </div>
      </form>
    </Modal>
  );
}

export function NewOrderModal({
  open,
  onClose,
  customers,
  onCreate,
}: BaseProps & { customers: Customer[]; onCreate: (amount: number, customerId?: string) => Promise<void> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={t.orders.new}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await onCreate(Number(data.get("amount")), String(data.get("customer") ?? "") || undefined);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.orders.amount}</span>
          <input name="amount" type="number" required min={1} max={10000000} step={1} className={`${inputClass} mt-1`} autoFocus />
        </label>
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.orders.customer}</span>
          <select name="customer" defaultValue="" className={`${inputClass} mt-1`}>
            <option value="">{t.orders.none}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>{t.common.cancel}</button>
          <button type="submit" disabled={busy} className={`${primaryButtonClass} disabled:opacity-60`}>{t.common.create}</button>
        </div>
      </form>
    </Modal>
  );
}

export type NewCustomer = { name: string; email: string; company: string; phone: string; plan: string; status: string; source: string };

export function NewCustomerModal({ open, onClose, onCreate }: BaseProps & { onCreate: (customer: NewCustomer) => Promise<void> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const select = (name: string, label: string, options: [string, string][]) => (
    <label className="block text-sm">
      <span className={mutedTextClass}>{label}</span>
      <select name={name} className={`${inputClass} mt-1`}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </label>
  );
  const text = (name: string, label: string, type = "text") => (
    <label className="block text-sm">
      <span className={mutedTextClass}>{label}</span>
      <input name={name} type={type} required maxLength={120} className={`${inputClass} mt-1`} />
    </label>
  );
  return (
    <Modal open={open} onClose={onClose} title={t.customers.addTitle}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
          setBusy(true);
          try {
            await onCreate({ name: d.name, email: d.email, company: d.company, phone: d.phone, plan: d.plan, status: d.status, source: d.source });
          } finally {
            setBusy(false);
          }
        }}
      >
        {text("name", t.customers.colName)}
        {text("email", t.settings.email, "email")}
        {text("company", t.customers.colCompany)}
        {text("phone", t.settings.phone, "tel")}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {select("plan", t.customers.colPlan, Object.entries(t.customers.plan).map(([k, v]) => [k.toUpperCase(), v]))}
          {select("status", t.customers.colStatus, Object.entries(t.customers.status).map(([k, v]) => [k.toUpperCase(), v]))}
          {select("source", t.customers.sourceLabel, [["REFERRALS", t.traffic.referrals], ["ORGANIC", t.traffic.organic], ["PAID", t.traffic.paid], ["PARTNERSHIPS", t.traffic.partnerships]])}
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>{t.common.cancel}</button>
          <button type="submit" disabled={busy} className={`${primaryButtonClass} disabled:opacity-60`}>{t.common.create}</button>
        </div>
      </form>
    </Modal>
  );
}
