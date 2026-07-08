"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useAdminSectionState } from "@/components/admin/useAdminSectionState";

type Props = {
  id: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  padding?: "sm" | "md" | "lg";
  children: ReactNode;
};

export function CollapsibleAdminSection({
  id,
  title,
  description,
  badge,
  icon,
  defaultOpen = true,
  padding = "lg",
  children
}: Props) {
  const { isOpen, toggle } = useAdminSectionState(id, defaultOpen);

  return (
    <Card padding={padding}>
      <button
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={toggle}
        type="button"
      >
        <div className="flex min-w-0 items-start gap-2">
          {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown className={`text-muted transition-transform ${isOpen ? "" : "-rotate-90"}`} size={18} />
        </div>
      </button>
      {isOpen ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}
