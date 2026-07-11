"use client";

import type { ReactNode } from "react";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";

type Props = {
  children: ReactNode;
  locked?: boolean;
  className?: string;
};

export function KvartovidProtectedMedia({ children, locked = false, className = "" }: Props) {
  return (
    <div
      className={`relative ${locked ? "select-none" : ""} ${className}`}
      onContextMenu={locked ? (event) => event.preventDefault() : undefined}
    >
      {children}
      {locked ? <WatermarkOverlay label="DEMO" className="opacity-100" /> : null}
    </div>
  );
}
