"use client";

import { useI18n } from "../../lib/i18n";
import { DEMO_USER, type PageId } from "../../lib/mock";
import { LanguageSwitcher, ThemeToggle } from "./Switchers";
import { primaryGradientClass, secondaryButtonClass } from "./styles";

type NavbarProps = {
  links: readonly PageId[];
  activeLink: PageId;
  onSelectLink: (link: PageId) => void;
  onToggleMobileMenu: () => void;
  onExport: () => void;
  onNewReport: () => void;
};

export function Navbar({ links, activeLink, onSelectLink, onToggleMobileMenu, onExport, onNewReport }: NavbarProps) {
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
            title={DEMO_USER.name}
            aria-label={t.header.profile}
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)] min-[420px]:flex"
          >
            {DEMO_USER.initials}
          </div>
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
