import type { ProductionRow } from "@/types/production";
export const scrapRate = (nok: number, total: number) =>
  total > 0 ? (nok / total) * 100 : 0;
export const totals = (rows: ProductionRow[]) =>
  rows.reduce(
    (sum, row) => ({
      quantity: sum.quantity + row.quantity,
      quantity_ok: sum.quantity_ok + row.ok,
      quantity_nok: sum.quantity_nok + row.nok,
    }),
    { quantity: 0, quantity_ok: 0, quantity_nok: 0 },
  );
export const formatNumber = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);
