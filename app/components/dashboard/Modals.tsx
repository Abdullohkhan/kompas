"use client";

import { useState } from "react";
import { useI18n } from "../../lib/i18n";
import type { PageId, ReportType, TeamMember } from "../../lib/api/types";
import { InviteForm, TeamList } from "./Views";
import { inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import { Modal } from "./ui";

type BaseProps = { open: boolean; onClose: () => void };

export function InsightsModal({ open, onClose, page }: BaseProps & { page: PageId }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={`${t.insights.title}: ${t.titles[page]}`} subtitle={t.insights.subtitle}>
      <ul className="space-y-3">
        {t.insights.items[page].map((item) => (
          <li key={item} className="flex gap-3 rounded-xl bg-slate-100 p-3.5 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
            {item}
          </li>
        ))}
      </ul>
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

export function UpgradeModal({ open, onClose, onStart }: BaseProps & { onStart: () => void }) {
  const { t } = useI18n();
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
        <button type="button" onClick={onStart} className={primaryButtonClass}>{t.upgrade.startTrial}</button>
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
