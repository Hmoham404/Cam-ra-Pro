export function safeFilename(value: string): string {
  const stem = value
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 150);
  return `${stem || "Rapport"}.pdf`;
}
export function reportFilename(
  department: string,
  date: Date,
  id: string,
): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return safeFilename(`Rapport_${department}_${stamp}_${id.slice(0, 6)}`);
}
