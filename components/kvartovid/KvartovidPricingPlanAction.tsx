"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { KvartovidPaymentButton } from "@/components/kvartovid/KvartovidPaymentButton";
import type { KvartovidPaidPlanId, KvartovidPricingPlan } from "@/lib/kvartovid/pricing";

type Props = {
  plan: KvartovidPricingPlan;
};

const PAID_PLAN_IDS = new Set<KvartovidPaidPlanId>(["listing", "cover", "realtor"]);

function isPaidPlanId(planId: string): planId is KvartovidPaidPlanId {
  return PAID_PLAN_IDS.has(planId as KvartovidPaidPlanId);
}

export function KvartovidPricingPlanAction({ plan }: Props) {
  const buttonClassName = "w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400";

  if (plan.soon) {
    return (
      <Button className={buttonClassName} disabled variant="secondary">
        Скоро
      </Button>
    );
  }

  if (plan.id === "free") {
    return (
      <Link href="/kvartovid/create">
        <Button className={buttonClassName}>Попробовать бесплатно</Button>
      </Link>
    );
  }

  if (!isPaidPlanId(plan.id)) {
    return null;
  }

  return (
    <KvartovidPaymentButton className={buttonClassName} planId={plan.id}>
      Оплатить {plan.priceLabel}
    </KvartovidPaymentButton>
  );
}
