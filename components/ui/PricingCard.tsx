import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { MetrikaGoalLink } from "@/components/analytics/MetrikaGoalLink";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaymentButton } from "@/components/PaymentButton";

const WB_ACCENT_CLASS = "font-black text-[#CB11AB]";

function highlightWildberries(text: string): ReactNode {
  const parts = text.split(/(Wildberries|ВБ|WB)/g);

  return parts.map((part, index) =>
    part === "Wildberries" || part === "ВБ" || part === "WB" ? (
      <span className={WB_ACCENT_CLASS} key={index}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

type PricingCardProps = {
  name: string;
  subtitle?: string;
  price: string;
  unit: string;
  billingNote?: string;
  features: string[];
  cta: string;
  href: string;
  packageCount?: number;
  metrikaPlan?: string;
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({
  name,
  subtitle,
  price,
  unit,
  billingNote,
  features,
  cta,
  href,
  packageCount,
  metrikaPlan,
  highlighted = false,
  badge
}: PricingCardProps) {
  return (
    <Card
      className={`wow-card relative flex h-full flex-col ${highlighted ? "border-accent/60 bg-gradient-to-b from-card to-[#F4FBE3] text-ink shadow-[0_24px_60px_rgba(191,249,63,0.18)]" : "bg-card"}`}
      padding="lg"
    >
      {badge ? (
        <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${highlighted ? "border-accent bg-accent text-on-accent" : ""}`} variant="accent">
          {badge}
        </Badge>
      ) : null}

      <div>
        <h3 className="text-2xl font-black">{name}</h3>
        {subtitle ? <p className="mt-1 text-sm font-medium text-muted">{subtitle}</p> : null}
      </div>

      <div className="mt-5 border-b border-clay pb-6">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-black tracking-normal">{price}</span>
          <span className="pb-1 text-sm font-semibold text-muted">/ {unit}</span>
        </div>
        {billingNote ? <p className="mt-1 text-sm font-medium text-muted">{billingNote}</p> : null}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li className="flex items-start gap-3 text-sm" key={feature}>
            <Check className={`mt-0.5 shrink-0 ${highlighted ? "text-accent-ink" : "text-accent-ink"}`} size={16} />
            <span className="text-muted">{highlightWildberries(feature)}</span>
          </li>
        ))}
      </ul>

      {packageCount ? (
        <PaymentButton className="mt-8" count={packageCount} metrikaPlan={metrikaPlan} variant={highlighted ? "primary" : "secondary"}>
          {cta}
        </PaymentButton>
      ) : href.startsWith("http") ? (
        <a className="mt-8 block" href={href} rel="noopener noreferrer" target="_blank">
          <Button className="w-full" variant={highlighted ? "primary" : "secondary"}>
            {cta}
          </Button>
        </a>
      ) : (
        <MetrikaGoalLink className="mt-8 block" goal="pricing_click" href={href} params={{ plan: metrikaPlan ?? name }}>
          <Button className="w-full" variant={highlighted ? "primary" : "secondary"}>
            {cta}
          </Button>
        </MetrikaGoalLink>
      )}
    </Card>
  );
}
