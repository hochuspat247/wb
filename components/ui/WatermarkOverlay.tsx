type WatermarkOverlayProps = {
  label?: string;
  className?: string;
};

export function WatermarkOverlay({ label = "DEMO", className = "" }: WatermarkOverlayProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-[-35%] grid rotate-[-32deg] grid-cols-3 gap-8 opacity-[0.13]">
        {Array.from({ length: 18 }).map((_, index) => (
          <span className="text-center text-[clamp(1.4rem,4vw,2.4rem)] font-black tracking-[0.45em] text-white" key={index}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
