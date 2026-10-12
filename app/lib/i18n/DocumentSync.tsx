"use client";

import { useEffect } from "react";
import { useI18n } from ".";

/** Keeps <html lang>, <title> and the meta description in sync with the chosen language. */
export function DocumentSync() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t.meta.description);
  }, [locale, t]);

  return null;
}
