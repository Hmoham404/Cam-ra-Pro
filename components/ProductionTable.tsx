import { Plus, Trash2, Table2, RotateCcw } from "lucide-react";
import type { ProductionRow } from "@/types/production";
import { totals, formatNumber } from "@/lib/calculations";
export function ProductionTable({
  rows,
  onChange,
  disabled,
}: {
  rows: ProductionRow[];
  onChange: (rows: ProductionRow[]) => void;
  disabled: boolean;
}) {
  const sum = totals(rows);
  const update = (i: number, key: keyof ProductionRow, value: string) =>
    onChange(
      rows.map((row, index) =>
        index === i
          ? {
              ...row,
              [key]:
                key === "time" || key === "observation"
                  ? value
                  : Math.max(0, Math.round(Number(value) || 0)),
            }
          : row,
      ),
    );
  return (
    <section className="panel mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-xs font-extrabold">
          <Table2 size={16} className="text-slate-400" />
          Détail de la production
          <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
            {rows.length} ligne{rows.length !== 1 ? "s" : ""}
          </span>
        </h2>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <button
              disabled={disabled}
              onClick={() => onChange([...rows])}
              className="btn text-slate-500 !min-h-9 !px-2 !text-[10px]"
            >
              <RotateCcw size={12} />
              Recalculer les totaux
            </button>
          )}
          <button
            disabled={disabled}
            onClick={() =>
              onChange([
                ...rows,
                { time: "", quantity: 0, ok: 0, nok: 0, observation: "" },
              ])
            }
            className="btn !min-h-9 !px-2 !text-[10px] text-blue-600"
          >
            <Plus size={14} />
            Ajouter une ligne
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[11px]">
          <thead className="bg-slate-50/80 text-[9px] uppercase tracking-wider text-slate-400">
            <tr>
              {["Heure", "Quantité", "OK", "NOK", "Observation", ""].map(
                (h, i) => (
                  <th key={i} className="px-5 py-3 font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {(
                  ["time", "quantity", "ok", "nok", "observation"] as const
                ).map((key) => (
                  <td className="px-3 py-2" key={key}>
                    <input
                      aria-label={`${key} ligne ${i + 1}`}
                      disabled={disabled}
                      className={`w-full min-w-20 rounded border border-transparent bg-transparent px-2 py-2 text-xs hover:border-slate-200 focus:border-blue-300 ${key === "ok" ? "text-emerald-600" : key === "nok" ? "text-red-500" : ""}`}
                      type={
                        key === "time"
                          ? "time"
                          : key === "observation"
                            ? "text"
                            : "number"
                      }
                      min={0}
                      step={key === "time" ? 60 : 1}
                      value={row[key]}
                      onChange={(e) => update(i, key, e.target.value)}
                    />
                  </td>
                ))}
                <td className="pr-3">
                  <button
                    disabled={disabled}
                    aria-label={`Supprimer la ligne ${i + 1}`}
                    className="icon-btn hover:!text-red-500"
                    onClick={() =>
                      onChange(rows.filter((_, index) => index !== i))
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-7 text-center text-[11px] text-slate-400"
                >
                  Les lignes de votre fiche apparaîtront ici après l’analyse.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
              <tr>
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3">{formatNumber(sum.quantity)}</td>
                <td className="px-5 py-3 text-emerald-600">
                  {formatNumber(sum.quantity_ok)}
                </td>
                <td className="px-5 py-3 text-red-500">
                  {formatNumber(sum.quantity_nok)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
