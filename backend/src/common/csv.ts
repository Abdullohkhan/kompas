const cell = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of user-controlled text).
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** UTF-8 BOM so Excel opens Cyrillic/Uzbek text correctly. */
export const toCsv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
