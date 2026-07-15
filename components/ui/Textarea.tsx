import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-32 w-full resize-y rounded-[14px] border border-clay bg-card px-4 py-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted/55 focus:border-accent-ink/35 focus:ring-2 focus:ring-accent/25 ${className}`}
      {...props}
    />
  );
}
