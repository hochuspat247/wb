import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-32 w-full resize-y rounded-xl border border-ink/15 bg-[#fffaf0] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-4 focus:ring-mint/30 ${className}`}
      {...props}
    />
  );
}
