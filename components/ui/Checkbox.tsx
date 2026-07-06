import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border border-ink/15 bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-ink ${className}`}>
      <input className="h-4 w-4 rounded border-ink/30 accent-coral" type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
