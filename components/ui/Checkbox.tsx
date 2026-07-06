import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border border-clay bg-card px-4 py-3 text-sm font-medium text-ink ${className}`}
    >
      <input className="h-4 w-4 rounded border-clay accent-accent" type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
