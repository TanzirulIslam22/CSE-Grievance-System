function esc(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows) {
  return rows.map((row) => row.map(esc).join(",")).join("\r\n");
}

export function csvHeaders(filename) {
  return [
    ["Content-Type", "text/csv; charset=utf-8"],
    ["Content-Disposition", `attachment; filename="${filename}"`],
  ];
}