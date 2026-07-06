import Link from "next/link";

type LogoProps = {
  light?: boolean;
  href?: string;
};

export function Logo({ light = false, href = "/" }: LogoProps) {
  return (
    <Link className="group flex items-center gap-2.5" href={href}>
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${
          light ? "bg-white/10 text-accent" : "border border-clay bg-card text-accent"
        }`}
      >
        MC
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        MarketCard <span className={light ? "text-mint" : "text-accent"}>AI</span>
      </span>
    </Link>
  );
}
