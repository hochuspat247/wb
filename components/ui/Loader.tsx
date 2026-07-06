type LoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]"
};

export function Loader({ label, size = "md" }: LoaderProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`animate-spin rounded-full border-clay border-t-ink ${sizes[size]}`} />
      {label ? <p className="text-sm font-medium text-muted">{label}</p> : null}
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}
