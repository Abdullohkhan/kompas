"use client";

import { useI18n } from "../../lib/i18n";
import type { PageId, User } from "../../lib/api/types";
import { LanguageSwitcher, ThemeToggle } from "./Switchers";
import { primaryGradientClass, secondaryButtonClass } from "./styles";

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

type NavbarProps = {
  links: readonly PageId[];
  activeLink: PageId;
  onSelectLink: (link: PageId) => void;
  onToggleMobileMenu: () => void;
  onExport: () => void;
  onNewReport: () => void;
  user: User | undefined;
  onLogout: () => void;
};

export function Navbar({ links, activeLink, onSelectLink, onToggleMobileMenu, onExport, onNewReport, user, onLogout }: NavbarProps) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-7 sm:py-4 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={t.header.openMenu}
            onClick={onToggleMobileMenu}
            className="rounded-lg border border-slate-300 px-2.5 py-2.5 text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <span className="block h-0.5 w-4 bg-current" />
            <span className="mt-1 block h-0.5 w-4 bg-current" />
            <span className="mt-1 block h-0.5 w-4 bg-current" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:block">{t.header.dashboard}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              {t.titles[activeLink]}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <button type="button" onClick={onExport} className={`${secondaryButtonClass} hidden md:inline-flex`}>
            {t.common.export}
          </button>
          <button type="button" onClick={onNewReport} className={`${secondaryButtonClass} hidden md:inline-flex`}>
            {t.common.newReport}
          </button>
          <div
            title={user?.name}
            aria-label={t.header.profile}
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)] min-[420px]:flex"
          >
            {user ? initials(user.name) : ""}
          </div>
          <button type="button" onClick={onLogout} aria-label={t.auth.logout} title={t.auth.logout} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-slate-200/80 px-4 py-2.5 dark:border-slate-800/80 lg:hidden">
        <div className="flex gap-2.5">
          {links.map((link) => (
            <button
              type="button"
              key={link}
              onClick={() => onSelectLink(link)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                link === activeLink
                  ? `${primaryGradientClass} text-slate-950`
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              }`}
              aria-current={link === activeLink ? "page" : undefined}
            >
              {t.nav[link]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
