import { format, type Dictionary } from "../i18n";
import type { ActivityEvent, Insight } from "./types";

type Params = Record<string, string | number>;

export function activityText(t: Dictionary, event: ActivityEvent): string {
  const template = (t.activity as Record<string, string>)[event.type];
  return template ? format(template, (event.params ?? {}) as Params) : event.type;
}

/** Insight params arrive as stable keys (traffic source, weekday index); translate them here. */
export function insightText(t: Dictionary, insight: Insight): string {
  const template = (t.insights.items as Record<string, string>)[insight.type];
  if (!template) return insight.type;
  const p: Params = { ...insight.params };
  if (typeof p.key === "string") p.source = (t.traffic as Record<string, string>)[p.key] ?? p.key;
  if (typeof p.weekday === "number") p.day = t.chart.weekdays[p.weekday] ?? "";
  return format(template, p);
}

/** Deterministic dd.mm.yyyy so server and client render identically. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}
