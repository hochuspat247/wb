import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PricingCardProps = {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  highlighted = false,
  badge
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex h-full flex-col ${highlighted ? "border-accent/45 bg-gradient-to-b from-card to-paper text-ink" : "bg-card"}`}
      padding="lg"
    >
      {badge ? (
        <Badge className={`absolute -top-3 left-6 ${highlighted ? "border-mint bg-mint text-paper" : ""}`} variant="accent">
          {badge}
        </Badge>
      ) : null}
      <h3 className="text-2xl font-black">{name}</h3>
      <div className="mt-4">
        <span className="text-5xl font-black tracking-normal">{price}</span>
        <span className={`ml-2 text-sm ${highlighted ? "text-muted" : "text-muted"}`}>/{period}</span>
      </div>
      <ul className="mt-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li className="flex items-start gap-3 text-sm" key={feature}>
            <Check className={`mt-0.5 shrink-0 ${highlighted ? "text-mint" : "text-accent"}`} size={16} />
            <span className={highlighted ? "text-muted" : "text-muted"}>{feature}</span>
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
