import { ChevronDown, Info, CheckCircle2 } from "lucide-react";
import { DEPARTMENTS, type ProductionSheet } from "@/types/production";
import { scrapRate } from "@/lib/calculations";
export function ExtractionForm({
  sheet,
  onChange,
  ready,
  disabled,
}: {
  sheet: ProductionSheet;
  onChange: (s: ProductionSheet) => void;
  ready: boolean;
  disabled: boolean;
}) {
  const field = (
    key: keyof ProductionSheet,
    label: string,
    placeholder: string,
  ) => (
    <label key={key}>
      <span className="label">{label}</span>
      <input
        disabled={disabled}
        className="field"
        value={String(sheet[key] ?? "")}
        placeholder={placeholder}
        maxLength={key === "title" ? 200 : undefined}
        onChange={(e) => onChange({ ...sheet, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <div>
      <div
        className={`mb-5 flex items-start gap-2.5 rounded-lg px-3 py-3 text-[10px] leading-4 ${ready ? "bg-emerald-50 text-emerald-700" : "bg-blue-50/70 text-blue-600"}`}
      >
        {ready ? (
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        ) : (
          <Info size={15} className="mt-0.5 shrink-0" />
        )}
        <p>
          {ready ? (
            <>
              <strong>Extraction terminée.</strong> Veuillez vérifier les
              données avant de générer le PDF.
            </>
          ) : (
            <>
              Les champs se rempliront après l’analyse.
              <br />
              Vous pourrez les vérifier et les corriger ici.
            </>
          )}
        </p>
      </div>
      <div className="mb-5">
        {field("title", "Titre du document", "Titre détecté sur l’image")}
      </div>
      <h3 className="mb-3 flex items-center justify-between text-[11px] font-extrabold">
        Données générales
        <ChevronDown size={13} className="text-slate-400" />
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {field("date", "Date", "JJ/MM/AAAA")}
        <label>
          <span className="label">Département</span>
          <select
            disabled={disabled}
            className="field"
            value={sheet.department}
            onChange={(e) => onChange({ ...sheet, department: e.target.value })}
          >
            {!sheet.department && <option value="">À préciser</option>}
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        {field("machine", "Machine", "Ex. INJ-04")}
        {field("product_reference", "Référence produit", "Ex. CAP-245")}
        {field("work_order", "N° d’ordre de fabrication", "Ex. OF-260921-01")}
        {field("team", "Équipe", "Ex. Équipe A")}
      </div>
      <div className="my-5 border-t border-slate-100" />
      <h3 className="mb-3 text-[11px] font-extrabold">Production</h3>
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["quantity", "Quantité totale", "text-ink"],
            ["quantity_ok", "Quantité OK", "text-emerald-600"],
            ["quantity_nok", "Quantité NOK", "text-red-500"],
          ] as const
        ).map(([key, label, color]) => (
          <label key={key}>
            <span className={`label ${color}`}>{label}</span>
            <input
              disabled={disabled}
              className={`field font-semibold ${color}`}
              type="number"
              min="0"
              step="1"
              value={sheet[key]}
              onChange={(e) =>
                onChange({
                  ...sheet,
                  [key]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                })
              }
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px]">
        <span className="text-slate-400">
          Taux de rebut{" "}
          <span className="text-slate-300">· calculé automatiquement</span>
        </span>
        <span
          className={`font-bold ${sheet.quantity_nok ? "text-orange-600" : "text-slate-500"}`}
        >
          {scrapRate(sheet.quantity_nok, sheet.quantity).toFixed(2)} %
        </span>
      </div>
      <div className="my-5 border-t border-slate-100" />
      <h3 className="mb-3 text-[11px] font-extrabold">
        Qualité & observations
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {field("defect_type", "Défaut constaté", "Ex. Rayure")}
        <label>
          <span className="label">Observation</span>
          <textarea
            disabled={disabled}
            rows={1}
            className="field min-h-10 resize-y"
            value={sheet.observation}
            placeholder="Ajouter une remarque…"
            onChange={(e) =>
              onChange({ ...sheet, observation: e.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}
