"use client";

import { useSyncExternalStore } from "react";
import { en } from "./en";
import { ru } from "./ru";
import { uz, type Dictionary } from "./uz";

export type { Dictionary };
export const LOCALES = ["uz", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_STORAGE_KEY = "dashboard-locale";

const DICTIONARIES: Record<Locale, Dictionary> = { uz, en, ru };

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

const listeners = new Set<() => void>();
let current: Locale | null = null;

function readStored(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // storage unavailable (private mode, blocked) — fall back to default
  }
  return DEFAULT_LOCALE;
}

function getSnapshot(): Locale {
  if (current === null) current = readStored();
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLocale(locale: Locale) {
  current = locale;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore — the choice still applies for this session
  }
  listeners.forEach((listener) => listener());
}

/** Replaces `{name}`-style placeholders. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LOCALE);
  const t = DICTIONARIES[locale];
  return { locale, setLocale, t, format };
}
