import { SHEET_TYPES, type SheetType } from "@/types/production";
export function SheetTypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: SheetType;
  onChange: (value: SheetType) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="label">Type de fiche</span>
      <select
        className="field min-h-12"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value as SheetType)}
      >
        {SHEET_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
    </label>
  );
}
