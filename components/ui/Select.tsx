"use client";

import { ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes
} from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  variant?: "default" | "dark";
};

function parseOptions(children: ReactNode) {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;

    const props = child.props as {
      value?: string;
      children?: ReactNode;
      disabled?: boolean;
    };
    const label = String(props.children ?? "");
    options.push({
      value: props.value ?? label,
      label,
      disabled: props.disabled
    });
  });

  return options;
}

export function Select({
  className = "",
  children,
  value,
  onChange,
  variant = "default",
  disabled,
  name
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = parseOptions(children);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerClass =
    variant === "dark"
      ? "border-white/15 bg-white/5 text-white hover:border-white/25"
      : "border-clay bg-paper/40 text-ink hover:border-accent/25";

  const panelClass =
    variant === "dark" ? "border-white/12 bg-[#171C26] shadow-soft" : "border-clay bg-card shadow-soft";

  function getItemClass(active: boolean) {
    if (variant === "dark") {
      return active ? "bg-accent text-paper" : "text-white/85 hover:bg-white/8";
    }

    return active ? "bg-accent/15 text-ink" : "text-muted hover:bg-white/5 hover:text-ink";
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {name ? <input name={name} type="hidden" value={String(value ?? "")} /> : null}

      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left text-sm font-medium outline-none transition-all duration-200 focus:border-accent/45 focus:ring-2 focus:ring-accent/10 ${triggerClass} ${
          open ? "border-accent/45 ring-2 ring-accent/10" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-accent" : "text-muted"}`}
          size={16}
        />
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 origin-top overflow-hidden rounded-[14px] border p-1 transition-all duration-200 ease-out ${panelClass} ${
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
        id={listId}
        role="listbox"
      >
        {options.map((option, index) => (
          <button
            aria-selected={option.value === value}
            className={`select-option-item flex w-full rounded-[10px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${getItemClass(
              option.value === value
            )} ${option.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            disabled={option.disabled}
            key={option.value}
            onClick={() => {
              if (option.disabled) return;

              onChange?.({
                target: { value: option.value }
              } as ChangeEvent<HTMLSelectElement>);
              setOpen(false);
            }}
            role="option"
            style={{ transitionDelay: open ? `${index * 24}ms` : "0ms" }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
