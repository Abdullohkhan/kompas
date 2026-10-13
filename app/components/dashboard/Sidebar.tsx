"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "../../lib/i18n";
import { pageHref, type BillingStatus, type PageId } from "../../lib/api/types";
import { Logo } from "../Logo";
import { primaryButtonClass, primaryGradientClass } from "./styles";

type SidebarProps = {
  links: readonly PageId[];
  activeLink: PageId;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onUpgrade: () => void;
  onManageBilling: () => void;
  billing: BillingStatus | undefined;
};

export function Sidebar({ links, activeLink, isMobileOpen, onCloseMobile, onUpgrade, onManageBilling, billing }: SidebarProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen, onCloseMobile]);

  const navContent = (
    <>
      <div className="mb-10 flex items-center gap-3">
        <Logo size={32} className="rounded-lg shadow-[0_0_30px_rgba(56,189,248,0.35)]" />
        <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{t.brand}</p>
      </div>
      <nav aria-label={t.header.mainMenu} className="space-y-2">
        {links.map((link) => (
          <Link
            key={link}
            href={pageHref(link)}
            onClick={onCloseMobile}
            className={`block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-500 ${
              link === activeLink
                ? `${primaryGradientClass} text-slate-950 shadow-lg shadow-sky-500/20`
                : "text-slate-600 hover:translate-x-1 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
            }`}
            aria-current={link === activeLink ? "page" : undefined}
          >
            {t.nav[link]}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-sky-400/30 bg-linear-to-br from-sky-500/15 to-indigo-500/10 p-5">
        <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{billing?.viaSubscription ? t.upgrade.active : t.upgrade.cardTitle}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {billing?.viaSubscription ? t.upgrade.cardDesc : billing?.plan === "pro" ? t.upgrade.adminNote : t.upgrade.cardDesc}
        </p>
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            if (billing?.viaSubscription) onManageBilling();
            else onUpgrade();
          }}
          className={`${primaryButtonClass} mt-4 w-full`}
        >
          {billing?.viaSubscription ? t.upgrade.manage : t.upgrade.startTrial}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden border-r border-slate-200/70 bg-white/70 px-6 py-7 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 lg:flex lg:flex-col">
        {navContent}
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${isMobileOpen ? "pointer-events-auto" : "pointer-events-none"}`} inert={!isMobileOpen}>
        <button
          type="button"
          aria-label={t.header.closeMenu}
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-slate-200/70 bg-white px-6 py-7 shadow-xl transition-transform duration-300 dark:border-slate-800/70 dark:bg-slate-900 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
