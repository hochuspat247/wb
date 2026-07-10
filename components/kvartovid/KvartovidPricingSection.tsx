import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { KVARTOVID_PRICING_PLANS } from "@/lib/kvartovid/pricing";

export function KvartovidPricingSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16" id="pricing">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Тарифы</h2>
        <p className="mt-3 text-muted">Начните бесплатно, платите только за результат. Без подписки.</p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {KVARTOVID_PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-card border p-6 ${
              plan.badge === "Популярный"
                ? "border-amber-500/50 bg-amber-500/5"
                : "border-white/10 bg-card/50"
            }`}
          >
            {plan.badge ? (
              <span className="absolute -top-3 left-4 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-black">
                {plan.badge}
              </span>
            ) : null}
            {plan.soon ? (
              <span className="absolute -top-3 right-4 rounded-full border border-white/20 bg-[#0a1210] px-3 py-0.5 text-xs text-muted">
                Скоро
              </span>
            ) : null}
            <h3 className="text-lg font-bold text-ink">{plan.label}</h3>
            <p className="mt-2 text-2xl font-black text-amber-400">{plan.priceLabel}</p>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-amber-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/kvartovid/create" className="mt-6">
              <Button
                className="w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400"
                variant={plan.soon ? "secondary" : "primary"}
                disabled={plan.soon}
              >
                {plan.soon ? "Скоро" : "Попробовать"}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
