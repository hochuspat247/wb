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
  featured?: boolean;
};

export function ExampleCard({ title, subtitle, variant, theme, badges = [], featured = false }: ExampleCardProps) {
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
    <div className="group h-full overflow-hidden rounded-[22px] border border-ink/10 bg-card transition duration-300 hover:-translate-y-1 hover:border-ink/25">
      <div className={`relative aspect-[4/5] ${theme.bg}`}>
        {theme.label ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-ink">
            {theme.label}
          </span>
        ) : null}
        <div className="absolute left-4 right-4 top-16">
          <p className={`font-black leading-[0.96] text-white ${featured ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}>
            {title}
          </p>
          {subtitle ? (
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white ${theme.accent}`}>
              {subtitle}
            </span>
          ) : null}
        </div>
        <div className={`absolute left-1/2 -translate-x-1/2 ${featured ? "bottom-20" : "bottom-16"}`}>
          <div className={`rounded-2xl shadow-2xl ${featured ? "h-44 w-32" : "h-32 w-24"} ${theme.product}`} />
        </div>
        {badges.length > 0 ? (
          <div className="absolute bottom-4 right-4 space-y-1.5">
            {badges.map((badge) => (
              <div
                className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-ink shadow-sm"
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
