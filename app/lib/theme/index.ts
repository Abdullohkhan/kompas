"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "dashboard-theme";

/**
 * Runs in <head> before first paint (see app/layout.tsx) so there is no theme flash.
 * Stored choice wins, otherwise the system preference (prefers-color-scheme).
 */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,t=null,l=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}");l=localStorage.getItem("dashboard-locale")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.classList.toggle("dark",t==="dark");d.style.colorScheme=t;if(l==="uz"||l==="en"||l==="ru"){d.lang=l}})();`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function hasStoredTheme(): boolean {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark";
  } catch {
    return false;
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Follow the OS setting live until the user picks a theme explicitly.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (event: MediaQueryListEvent) => {
    if (hasStoredTheme()) return;
    apply(event.matches ? "dark" : "light");
    notify();
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

export function setTheme(theme: Theme) {
  apply(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore — the choice still applies for this session
  }
  notify();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark" as Theme);
  return { theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") };
}
