"use client";

import { LOCALES, useI18n } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? t.header.themeToLight : t.header.themeToDark;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {/* Both icons are always rendered; CSS picks one, so there is no icon flash before hydration. */}
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-[18px] w-[18px] dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t.header.language}
      className="flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={code === locale}
          title={t.languages[code]}
          className={`rounded-md px-2 py-1.5 text-xs font-semibold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${
            code === locale
              ? "bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
