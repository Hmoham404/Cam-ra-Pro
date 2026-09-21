import { Check, Layers3, Paintbrush, Puzzle, Factory } from "lucide-react";
import { DEPARTMENTS, type Department } from "@/types/production";
const visuals = [
  {
    icon: Factory,
    color: "text-blue-600",
    bg: "bg-blue-50",
    line: "border-blue-500 bg-blue-50/40",
  },
  {
    icon: Layers3,
    color: "text-orange-500",
    bg: "bg-orange-50",
    line: "border-orange-400 bg-orange-50/40",
  },
  {
    icon: Paintbrush,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    line: "border-emerald-500 bg-emerald-50/40",
  },
  {
    icon: Puzzle,
    color: "text-violet-500",
    bg: "bg-violet-50",
    line: "border-violet-500 bg-violet-50/40",
  },
];
export function DepartmentSelector({
  value,
  onChange,
  disabled,
}: {
  value: Department;
  onChange: (value: Department) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {DEPARTMENTS.map((name, i) => {
        const v = visuals[i];
        const Icon = v.icon;
        return (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={value === name}
            key={name}
            onClick={() => onChange(name)}
            className={`relative flex min-h-[84px] items-center gap-3 rounded-xl border px-4 text-left transition hover:shadow-sm ${value === name ? v.line : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${v.color} ${v.bg}`}
            >
              <Icon size={21} strokeWidth={1.7} />
            </span>
            <span>
              <span className="block text-xs font-bold">{name}</span>
              <span className="mt-1 block text-[9px] text-slate-400">
                Département 0{i + 1}
              </span>
            </span>
            {value === name && (
              <span className={`absolute top-2 right-2 ${v.color}`}>
                <Check size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
