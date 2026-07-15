import Link from "next/link";
import { CARD_GENERATION_PRICE_RUB, formatRub } from "@/lib/pricing";

export function PriceTopStrip() {
  return (
    <div className="border-b border-ink/10 bg-accent text-ink">
      <Link
        className="section-shell flex items-center justify-center gap-x-2 py-2.5 text-center text-sm font-semibold tracking-tight transition hover:bg-ink/[0.04]"
        href="/#pricing-calculator"
      >
        <span>
          1 карточка — {formatRub(CARD_GENERATION_PRICE_RUB)}. Больше объём — дешевле за штуку
        </span>
        <span aria-hidden className="hidden sm:inline">
          →
        </span>
      </Link>
    </div>
  );
}
