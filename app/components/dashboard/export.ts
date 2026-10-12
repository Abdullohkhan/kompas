import type { Dictionary } from "../../lib/i18n";
import type { PageData, PageId, Report } from "../../lib/api/types";
import { reportName } from "./Views";

const escapeCell = (value: string | number) => {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(rows: (string | number)[][]): string {
  // BOM so Excel opens UTF-8 (Cyrillic, Uzbek apostrophes) correctly.
  return "﻿" + rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function pageRows(t: Dictionary, page: PageId, data: PageData): (string | number)[][] {
  return [
    [t.export.section, t.export.colMetric, t.export.colValue, t.export.colTrend],
    ...data.stats.map((s) => [t.titles[page], t.stats[s.key].label, s.value, s.trend]),
    [],
    [t.export.section, t.export.colMetric, t.export.colShare],
    ...data.traffic.map((s) => [t.sections.breakdown[page], t.traffic[s.key], s.value]),
  ];
}

export function reportRows(t: Dictionary, report: Report): (string | number)[][] {
  return [
    [t.export.colMetric, t.export.colValue],
    [t.customers.colName, reportName(report, t.reports.names)],
    [t.reports.typeLabel, t.reports.types[report.type]],
    [t.customers.colStatus, t.reports.status[report.status]],
    [t.customers.colJoined, report.createdAt],
    ["Rows", report.rows],
  ];
}
