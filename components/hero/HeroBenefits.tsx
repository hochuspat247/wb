import { HERO_BENEFITS } from "@/lib/hero/benefits";

type HeroBenefitsProps = {
  className?: string;
  columns?: 1 | 2;
};

export function HeroBenefits({ className = "", columns = 2 }: HeroBenefitsProps) {
  const columnClass = columns === 1 ? "grid-cols-1" : "sm:grid-cols-2";

  return (
    <ul className={`grid gap-2 ${columnClass} ${className}`.trim()}>
      {HERO_BENEFITS.map((item) => (
        <li className="flex items-start gap-2 text-sm font-semibold text-muted" key={item}>
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
