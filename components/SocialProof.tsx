import { Reveal } from "@/components/ui/Reveal";

const stats = [
  { value: "2 мин", label: "среднее время на карточку" },
  { value: "4", label: "маркетплейса из коробки" },
  { value: "3", label: "бесплатные карточки" }
];

const marketplaces = ["Wildberries", "Ozon", "Avito", "Яндекс Маркет"];

export function SocialProof() {
  return (
    <section className="relative py-6">
      <div className="section-shell">
        <Reveal>
          <div className="premium-card flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-muted">Работает с</span>
              {marketplaces.map((name) => (
                <span
                  className="rounded-full border border-ink/8 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-coral/30 hover:shadow-soft"
                  key={name}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-8">
              {stats.map((stat, i) => (
                <div className="text-center md:text-right" key={stat.label}>
                  <p className="text-3xl font-black gradient-text" style={{ animationDelay: `${i * 0.5}s` }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
