import { primaryGradientClass } from "./styles";
import type { DashboardPage } from "./types";

type SidebarProps = {
  links: readonly DashboardPage[];
  activeLink?: DashboardPage;
  onSelectLink?: (link: DashboardPage) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({
  links,
  activeLink = links[0],
  onSelectLink,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (link: DashboardPage) => {
    onSelectLink?.(link);
    onCloseMobile?.();
  };

  const navContent = (
    <>
      <div className="mb-12 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-sky-400 to-indigo-500 shadow-[0_0_30px_rgba(56,189,248,0.35)]" />
        <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">PulseBoard</p>
      </div>
      <nav className="space-y-2.5">
        {links.map((link) => (
          <button
            type="button"
            key={link}
            onClick={() => handleSelect(link)}
            className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
              link === activeLink
                ? `${primaryGradientClass} text-slate-950 shadow-lg shadow-sky-500/20`
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
            }`}
            aria-current={link === activeLink ? "page" : undefined}
          >
            {link}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-sky-400/20 bg-linear-to-br from-sky-500/15 to-indigo-500/10 p-5">
        <p className="text-sm font-semibold text-sky-300">Upgrade to Pro</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Unlock advanced analytics and unlimited reports.</p>
        <button
          type="button"
          className={`mt-4 w-full rounded-lg ${primaryGradientClass} px-3 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:brightness-110`}
        >
          Start trial
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden border-r border-slate-200/70 bg-white/70 px-6 py-7 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 lg:flex lg:flex-col">
        {navContent}
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${isMobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-300 ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-200/70 bg-white/95 px-6 py-7 shadow-xl backdrop-blur-xl transition-transform duration-300 dark:border-slate-800/70 dark:bg-slate-900/95 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
