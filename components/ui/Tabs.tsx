"use client";

import type { ReactNode } from "react";

type TabsProps = {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className = "" }: TabsProps) {
  return (
    <div className={`inline-flex rounded-full border border-clay bg-paper p-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            active === tab.id ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type TabPanelProps = {
  children: ReactNode;
  active: boolean;
};

export function TabPanel({ children, active }: TabPanelProps) {
  if (!active) return null;
  return <div role="tabpanel">{children}</div>;
}
