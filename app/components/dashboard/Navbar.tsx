import { primaryGradientClass } from "./styles";
import type { DashboardPage } from "./types";

type NavbarProps = {
  links: readonly DashboardPage[];
  activeLink?: DashboardPage;
  onSelectLink?: (link: DashboardPage) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onToggleMobileMenu?: () => void;
};

export function Navbar({
  links,
  activeLink = links[0],
  onSelectLink,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="flex items-center justify-between px-5 py-4 sm:px-7 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={onToggleMobileMenu}
            className="rounded-lg border border-slate-300 px-2.5 py-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <span className="block h-0.5 w-4 bg-slate-600 dark:bg-slate-300" />
            <span className="mt-1 block h-0.5 w-4 bg-slate-600 dark:bg-slate-300" />
            <span className="mt-1 block h-0.5 w-4 bg-slate-600 dark:bg-slate-300" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Dashboard
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Business Overview
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            className="hidden rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800 sm:inline-flex"
          >
            Export
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          >
            New Report
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)]">
            LK
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-slate-200/80 px-5 py-2.5 dark:border-slate-800/80 lg:hidden">
        <div className="flex gap-2.5">
          {links.map((link) => (
            <button
              type="button"
              key={link}
              onClick={() => onSelectLink?.(link)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                link === activeLink
                  ? `${primaryGradientClass} text-slate-950`
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              }`}
              aria-current={link === activeLink ? "page" : undefined}
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
