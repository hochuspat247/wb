"use client";

import type { ReactNode } from "react";

type ProtectedDemoTextProps = {
  children: ReactNode;
  locked?: boolean;
  className?: string;
};

export function ProtectedDemoText({ children, locked = true, className = "" }: ProtectedDemoTextProps) {
  if (!locked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`select-none ${className}`}
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {children}
    </div>
  );
}
