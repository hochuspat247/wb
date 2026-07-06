type ExampleCardProps = {
  title: string;
  subtitle?: string;
  variant: "before" | "after";
  theme: {
    bg: string;
    accent: string;
    product: string;
    label?: string;
  };
  badges?: string[];
};

export function ExampleCard({ title, subtitle, variant, theme, badges = [] }: ExampleCardProps) {
  if (variant === "before") {
    return (
      <div className="overflow-hidden rounded-card border border-clay bg-[#E8E4DE]">
        <div className="flex aspect-[4/5] flex-col">
          <div className="flex flex-1 items-center justify-center p-8">
            <div className={`h-36 w-28 rounded-2xl ${theme.product} opacity-80`} />
          </div>
          <div className="border-t border-clay/60 bg-[#DDD8D0] p-4">
            <p className="text-sm font-medium text-muted">{title}</p>
            <p className="mt-1 text-xs text-muted/70">Сырое фото · без обработки</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-card border border-clay bg-card transition duration-300 hover:-translate-y-1 hover:border-ink/10">
      <div className={`relative aspect-[4/5] ${theme.bg}`}>
        {theme.label ? (
          <span className="absolute left-4 top-4 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
            {theme.label}
          </span>
        ) : null}
        <div className="absolute left-4 right-4 top-14">
          <p className="text-lg font-bold leading-tight text-white md:text-xl">{title}</p>
          {subtitle ? (
            <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white ${theme.accent}`}>
              {subtitle}
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className={`h-28 w-20 rounded-xl shadow-2xl ${theme.product}`} />
        </div>
        {badges.length > 0 ? (
          <div className="absolute bottom-4 right-4 space-y-1">
            {badges.map((badge) => (
              <div
                className="rounded-md bg-white/95 px-2 py-1 text-[9px] font-semibold text-ink shadow-sm"
                key={badge}
              >
                {badge}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
