import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertProps = {
  children: ReactNode;
  variant?: "info" | "success" | "error";
  className?: string;
};

const styles = {
  info: {
    wrap: "border-clay bg-paper text-ink",
    icon: <Info className="shrink-0 text-muted" size={18} />
  },
  success: {
    wrap: "border-mint/40 bg-mint/10 text-ink",
    icon: <CheckCircle2 className="shrink-0 text-ink" size={18} />
  },
  error: {
    wrap: "border-accent/30 bg-accent/5 text-ink",
    icon: <AlertCircle className="shrink-0 text-accent" size={18} />
  }
};

export function Alert({ children, variant = "info", className = "" }: AlertProps) {
  const style = styles[variant];

  return (
    <div className={`flex min-w-0 gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${style.wrap} ${className}`}>
      {style.icon}
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}
