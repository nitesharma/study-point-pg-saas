/**
 * Lightweight client-side CSV / Excel export utility
 * Uses native Blob and UTF-8 BOM so Microsoft Excel opens special characters correctly without external dependencies.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map(row => row.map(escapeCell).join(","))
  ].join("\r\n");

  // UTF-8 BOM \uFEFF ensures Excel renders UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
