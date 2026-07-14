import { NANOBANANA_IMAGE_RETENTION_NOTICE } from "@/lib/ai/nanobananaExpert";

type NanoBananaRetentionNoticeProps = {
  className?: string;
  variant?: "default" | "dark" | "violet";
};

export function NanoBananaRetentionNotice({
  className = "",
  variant = "default"
}: NanoBananaRetentionNoticeProps) {
  const styles =
    variant === "dark"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
      : variant === "violet"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
        : "border-amber-500/20 bg-amber-500/5 text-muted";

  return (
    <p className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${styles} ${className}`.trim()}>
      {NANOBANANA_IMAGE_RETENTION_NOTICE}
    </p>
  );
}
