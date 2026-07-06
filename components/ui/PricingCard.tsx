import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PricingCardProps = {
  name: string;
  subtitle?: string;
  price: string;
  unit: string;
  billingNote?: string;
  features: string[];
  cta: string;
  href: string;
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
  highlighted = false,
  badge
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex h-full flex-col ${highlighted ? "border-accent/45 bg-gradient-to-b from-card to-paper text-ink shadow-[0_24px_80px_rgba(124,255,107,0.08)]" : "bg-card"}`}
      padding="lg"
    >
      {badge ? (
        <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${highlighted ? "border-mint bg-mint text-paper" : ""}`} variant="accent">
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
            <Check className={`mt-0.5 shrink-0 ${highlighted ? "text-mint" : "text-accent"}`} size={16} />
            <span className="text-muted">{feature}</span>
          </li>
        ))}
      </ul>

      <Link className="mt-8 block" href={href}>
        <Button className="w-full" variant={highlighted ? "primary" : "secondary"}>
          {cta}
        </Button>
      </Link>
    </Card>
  );
}
