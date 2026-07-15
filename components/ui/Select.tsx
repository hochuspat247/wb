"use client";

import { ChevronDown, Lock } from "lucide-react";
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
  onDisabledOptionClick?: (value: string) => void;
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
  onDisabledOptionClick,
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
    if (!onChange || disabled || !options.length) {
      return;
    }

    const hasActiveMatch = options.some((option) => option.value === value && !option.disabled);

    if (hasActiveMatch) {
      return;
    }

    const fallback = options.find((option) => !option.disabled) ?? options[0];

    if (fallback && fallback.value !== value) {
      onChange({
        target: { value: fallback.value }
      } as ChangeEvent<HTMLSelectElement>);
    }
  }, [disabled, onChange, options, value]);

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
      ? "border-ink/15 bg-ink text-white hover:border-ink/30"
      : "border-clay bg-card text-ink hover:border-ink/20";

  const panelClass =
    variant === "dark" ? "border-ink/20 bg-ink shadow-soft" : "border-clay bg-card shadow-soft";

  function getItemClass(active: boolean) {
    if (variant === "dark") {
      return active ? "bg-accent text-on-accent" : "text-white/85 hover:bg-white/10";
    }

    return active ? "bg-accent/25 text-ink" : "text-muted hover:bg-sand hover:text-ink";
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
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-accent-ink" : "text-muted"}`}
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
              if (option.disabled) {
                onDisabledOptionClick?.(option.value);
                return;
              }

              onChange?.({
                target: { value: option.value }
              } as ChangeEvent<HTMLSelectElement>);
              setOpen(false);
            }}
            role="option"
            style={{ transitionDelay: open ? `${index * 24}ms` : "0ms" }}
            type="button"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="truncate">{option.label}</span>
              {option.disabled ? <Lock className="shrink-0 opacity-70" size={14} /> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
