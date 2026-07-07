"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getAvailableSeriesTypes, getSeriesTypeLabel } from "@/lib/series/plan";

type SeriesTypePickerProps = {
  category: string;
  marketplace: string;
  style: string;
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  darkConsole?: boolean;
};

const VISIBLE_COUNT = 8;

export function SeriesTypePicker({
  category,
  marketplace,
  style,
  selectedTypes,
  onChange,
  darkConsole = false
}: SeriesTypePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const availableTypes = getAvailableSeriesTypes(category);
  const hiddenCount = Math.max(0, availableTypes.length - VISIBLE_COUNT);
  const visibleTypes = expanded ? availableTypes : availableTypes.slice(0, VISIBLE_COUNT);

  useEffect(() => {
    const hasHiddenSelected = selectedTypes.some((type) => availableTypes.indexOf(type) >= VISIBLE_COUNT);
    if (hasHiddenSelected) {
      setExpanded(true);
    }
  }, [availableTypes, selectedTypes]);

  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        return;
      }

      onChange(selectedTypes.filter((item) => item !== type));
      return;
    }

    onChange(
      [...selectedTypes, type].sort((left, right) => availableTypes.indexOf(left) - availableTypes.indexOf(right))
    );
  }

  const pillBase = darkConsole
    ? "border-white/15 bg-white/5 text-white/80 hover:border-white/25"
    : "border-clay bg-paper text-ink hover:border-accent/30";
  const pillActive = darkConsole ? "border-mint/50 bg-mint/15 text-white" : "border-accent bg-accent/10 text-ink";

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        {visibleTypes.map((type) => {
          const label = getSeriesTypeLabel(type, marketplace, style);
          const checked = selectedTypes.includes(type);

          return (
            <button
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${checked ? pillActive : pillBase}`}
              key={type}
              onClick={() => toggleType(type)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
      {hiddenCount > 0 ? (
        <button
          className={`inline-flex items-center gap-1 text-sm font-medium ${darkConsole ? "text-white/50 hover:text-white/80" : "text-muted hover:text-ink"}`}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`} size={16} />
          {expanded ? "Свернуть" : `Ещё ${hiddenCount} типов`}
        </button>
      ) : null}
    </div>
  );
}
